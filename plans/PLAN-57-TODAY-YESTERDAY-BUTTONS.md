# Plan 57: Today/Yesterday Button Styling

**Status: 🔲 Draft** · **Priority: P2** · **Effort: Low** · **Impact: Medium**

**Validated Feb 2026:** `_index.tsx` still uses `bg-[var(--color-primary)]` for active and `bg-[var(--color-surface-elevated)]` for inactive. Still relevant.

## Problem

The Today/Yesterday toggle buttons on the index page look terrible in both light and dark mode:

- **Active state (Today)**: Uses `bg-[var(--color-primary)] text-white`. The `--color-primary` variable maps to shadcn's `--primary`, which in dark mode is `oklch(0.922 0 0)` — a neutral light gray, not the app's violet brand color. Result: washed-out light gray button with poor text contrast.
- **Inactive state (Yesterday)**: Uses `bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)]`. In dark mode, the elevated surface blends with the page background, and text-muted has low contrast, making the inactive option hard to read and visually indistinct.
- **Inconsistent with app**: The rest of the app uses `primary-500` / `primary-600` (violet) for accents. These buttons are the only ones using `--color-primary` (shadcn's neutral primary).

## Root Cause

The app has two "primary" concepts that are not aligned:

1. **App brand primary** (violet): `--color-primary-500`, `primary-500`, `primary-600` in `tailwind.css` — used by nav, RefreshButton, MetricsCard, FullSummaryForm CTA, etc.
2. **Shadcn primary** (neutral): `--color-primary` → `var(--primary)` from `:root`/`.dark` — grayscale, used only by these buttons.

## Tasks

1. [ ] **Replace `--color-primary` with `primary-600` for active state**
   - Change active button from `bg-[var(--color-primary)] text-white` to `bg-primary-600 text-white`
   - Ensures violet brand color in both themes; white text has strong contrast on violet.

2. [ ] **Improve inactive state for clarity**
   - Option A (recommended): Give inactive buttons a distinct surface so they read as clickable:
     - `bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)] border border-[var(--color-border)]`
   - Option B: Match ChartsContent segmented control pattern (no bg on inactive):
     - Inactive: `text-[var(--color-text-muted)] hover:text-[var(--color-text)]` (no background)
     - Wrap in a container: `flex rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-surface-elevated)]` so both options sit in a single pill/segmented control.
   - Option B provides clearer visual grouping and matches the repos chart tabs.

3. [ ] **Add hover state for active button**
   - `hover:bg-primary-500` for consistency with other primary buttons (e.g. FullSummaryForm submit).

4. [ ] **Add focus-visible ring**
   - `focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2` for keyboard accessibility (matches MetricsCard, WeeklyTicker).

## Recommended Implementation

Align with the **ChartsContent segmented control** pattern for consistency:

```tsx
<div
  role="tablist"
  aria-label="Date range"
  className="flex rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-surface-elevated)]"
>
  {(["today", "yesterday"] as const).map((mode) => (
    <button
      key={mode}
      type="button"
      role="tab"
      aria-selected={viewMode === mode}
      onClick={() => setViewMode(mode)}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        viewMode === mode
          ? "bg-primary-600 text-white shadow-sm hover:bg-primary-500"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      }`}
    >
      {mode.charAt(0).toUpperCase() + mode.slice(1)}
    </button>
  ))}
</div>
```

This gives:
- **Active**: Violet background, white text, good contrast in both themes.
- **Inactive**: Muted text that brightens on hover; no competing background.
- **Container**: Border + elevated surface creates a clear segmented control.
- **Accessibility**: `role="tablist"`/`role="tab"`/`aria-selected` for screen readers; focus ring for keyboard.

## Success Criteria

- [ ] Active button uses violet (`primary-600`) in light and dark mode
- [ ] Text on active button has WCAG AA contrast (white on violet)
- [ ] Inactive button is clearly readable and distinguishable from active
- [ ] Hover states provide clear feedback
- [ ] Focus-visible ring appears on keyboard focus
- [ ] Visual style consistent with ChartsContent tabs and app design system

## Files to Modify

- `app/routes/_index.tsx` — Today/Yesterday button markup and classes
