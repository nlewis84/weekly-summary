# PLAN-66: Cursor Affordances Across the App

**Status:** Draft · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** Interactive elements (buttons, links, clickable cards, etc.) should show `cursor: pointer` on hover to signal clickability. Many elements in the app lack this affordance.

## Problem

Interactive elements that don't show `cursor: pointer` on hover fail to signal that they are clickable. Users rely on cursor changes as a primary affordance. Elements that are currently missing or inconsistent:

| Element | Location | Issue |
|---------|----------|-------|
| Refresh button | RefreshButton.tsx | No cursor-pointer |
| Today/Yesterday tabs | _index.tsx | Tab buttons may lack cursor |
| Export CSV, Export PDF, Copy markdown | Charts, History | Action buttons may lack cursor |
| Retry button | ErrorBanner | No cursor-pointer |
| Theme toggle | ThemeToggle | No cursor-pointer |
| Metrics card Copy, Details toggle | MetricsCard | Buttons may lack cursor |
| WeeklyTicker Copy | WeeklyTicker | Button may lack cursor |
| Build Summary submit | FullSummaryForm | Submit button may lack cursor |
| Charts view tabs (Weekly/Annual) | charts.tsx | Tab buttons may lack cursor |
| Repos view toggle (Most active / Over time) | ChartsContent | Buttons may lack cursor |
| History: Select all, Clear, Export, week selection | history._index | Buttons may lack cursor |
| History compare week selects | history.compare | Select elements use default cursor (OK) |
| Settings theme cards, Clear goals | settings.tsx | Cards have cursor-pointer; Clear may lack |
| Shortcuts help close | ShortcutsHelp | Button may lack cursor |
| Details `<summary>` | FullSummaryForm, MetricsCard | Has cursor-pointer (good) |

## Scope

- **In scope:** All `<button>`, clickable `<div>`/`<span>`, and `<a>` elements that trigger actions (excluding native form controls like `<select>` which have their own cursor behavior).
- **Out of scope:** Links (`<Link>`, `<a href>`) — these typically get `cursor: pointer` from browser or global styles. Verify if any need explicit cursor.

## Approach

### Option A: Global Utility Class

Add a global rule or Tailwind utility so all buttons get `cursor-pointer` by default:

```css
/* In root.css or similar */
button:not(:disabled) {
  cursor: pointer;
}
button:disabled {
  cursor: not-allowed;
}
```

**Pros:** One change fixes all buttons.  
**Cons:** May affect third-party components; need to verify no unintended overrides.

### Option B: Audit and Fix Per-Component

Audit each interactive element and add `cursor-pointer` (and `cursor-wait`/`cursor-not-allowed` where appropriate) to their `className`.

**Pros:** Explicit, no global side effects.  
**Cons:** More files to touch; easy to miss new buttons.

### Option C: Hybrid

- Add global `button:not(:disabled) { cursor: pointer }` for buttons.
- Add `cursor-pointer` to any non-button clickable elements (e.g. clickable cards, custom divs with onClick).
- Add `cursor-wait` or `cursor-not-allowed` for loading/disabled states where needed.

**Recommendation:** Option C. Buttons are the majority; a global rule covers them. Then audit for non-button clickables and special states.

## Affected Files (Audit List)

| File | Elements to Check |
|------|-------------------|
| `app/components/RefreshButton.tsx` | button |
| `app/components/ErrorBanner.tsx` | Retry button |
| `app/components/ThemeToggle.tsx` | Theme button |
| `app/components/MetricsCard.tsx` | Copy, Details toggle |
| `app/components/WeeklyTicker.tsx` | Copy button |
| `app/components/FullSummaryForm.tsx` | Submit, details summary |
| `app/components/ChartsContent.tsx` | Repos view toggle buttons |
| `app/components/ShortcutsHelp.tsx` | Close button |
| `app/routes/_index.tsx` | Today/Yesterday tab buttons |
| `app/routes/charts.tsx` | View tabs, Export CSV, Refresh |
| `app/routes/history._index.tsx` | Select all, Clear, Export, week toggle |
| `app/routes/history.$week.tsx` | Export PDF, Copy markdown |
| `app/routes/history.compare.tsx` | (selects—OK) |
| `app/routes/settings.tsx` | Theme cards (have cursor), Clear goals button |
| `app/root.tsx` | Error boundary Retry |
| `app/routes/charts.tsx` ErrorBoundary | Retry, Go home (Link) |

## Tasks

1. [ ] Add global `button:not(:disabled) { cursor: pointer }` (or equivalent) in root CSS
2. [ ] Add `button:disabled { cursor: not-allowed }` for disabled state
3. [ ] Audit non-button clickables (divs with onClick, custom cards) and add `cursor-pointer`
4. [ ] For loading states (e.g. Refresh), add `cursor-wait` where appropriate
5. [ ] Verify Links (`<Link>`) show pointer—add `cursor-pointer` if not
6. [ ] Test hover states across main flows: Index, Charts, History, Settings
7. [ ] Update plans/README.md with Plan 66

## Success Criteria

- All interactive buttons show `cursor: pointer` on hover when enabled
- Disabled buttons show `cursor: not-allowed`
- Loading-state buttons (e.g. Refresh) show `cursor: wait` or equivalent
- Non-button clickables (cards, toggles) show `cursor: pointer`
- No regressions in focus or keyboard navigation
