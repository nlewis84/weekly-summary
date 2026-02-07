# Plan 72: Build Weekly Summary – Always Visible Form

**Status:** Draft · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** The Build Weekly Summary card uses a collapsible `<details>` element. Users must click "Build Weekly Summary" to reveal the Check-ins textarea, Today only checkbox, and Generate & Save button. This plan makes the form body always visible so users can immediately see and use the inputs without an extra click.

## Problem

- **Current behavior:** Inputs and button are hidden inside `<details>` until the user clicks the summary
- **Friction:** Users visiting to build a summary must first expand the card—an unnecessary step when the form is a primary action
- **Discoverability:** Even with the header link that scrolls to `#build-summary` (Plan 04), the form content is still collapsed when they arrive

## Current State

- `FullSummaryForm` wraps content in `<details>` with `<summary>Build Weekly Summary</summary>`
- A `useEffect` opens the details when `window.location.hash === "#build-summary"` (scroll-to-form from header)
- E2E test `index.spec.ts` explicitly clicks "Build Weekly Summary" before asserting the form is visible

## Affected Files

| File | Role |
|------|------|
| `app/components/FullSummaryForm.tsx` | Replace `<details>` with always-visible card; remove expand/collapse logic |
| `e2e/index.spec.ts` | Remove click step; form should be visible on load |

## Solution Approach

### Replace `<details>` with a Card

1. **Structure change:** Replace `<details>` + `<summary>` with a div-based card:
   - Header: Same visual (icon + "Build Weekly Summary") but not clickable as a toggle
   - Body: Same content (Last built, form, error, success, MetricsCard) always visible
   - Preserve existing classes for layout, shadows, borders, and divider

2. **Remove expand logic:**
   - Remove `detailsRef` and `openIfHash` useEffect (navigate to `#build-summary` will still scroll to the section; no need to "open" anything)
   - Keep scroll-into-view behavior when hash is `#build-summary` (optional polish—header link already scrolls to the container)

3. **Style parity:** Ensure the card looks the same as before when expanded—header divider, padding, spacing—so there's no visual regression.

## Implementation Details

### `app/components/FullSummaryForm.tsx`

**Before (simplified):**
```tsx
<details ref={detailsRef} className="...">
  <summary className="...">Build Weekly Summary</summary>
  <div className="px-5 pb-5 pt-4 border-t ...">
    {/* form content */}
  </div>
</details>
```

**After:**
```tsx
<div className="w-full xl:w-96 bg-surface rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) xl:flex-1 xl:min-h-0 xl:flex xl:flex-col">
  <div className="flex items-center gap-2 px-5 py-4 font-medium text-(--color-text)">
    <FileText size={20} weight="regular" className="text-primary-500 shrink-0" />
    Build Weekly Summary
  </div>
  <div className="px-5 pb-5 pt-4 border-t border-(--color-border) space-y-4 xl:flex-1 xl:min-h-0">
    {/* form content unchanged */}
  </div>
</div>
```

**Cleanup:**
- Remove `detailsRef` and its `useRef`
- Remove or simplify the `openIfHash` useEffect: if desired, keep only the scroll-into-view when hash is `#build-summary` (the parent `#build-summary` div already exists, so scrolling will work)
- Remove `cursor-pointer` and `list-none [&::-webkit-details-marker]:hidden` from the header (no longer a summary)

### `e2e/index.spec.ts`

- In "Build Summary form is present and submittable": remove the line `await page.getByText("Build Weekly Summary").click();`
- Assertions for Check-ins label, Generate & Save button, and form remain the same—they should pass immediately after `page.goto("/")`

## Tasks

1. [ ] Replace `<details>` with a div-based card in `FullSummaryForm.tsx`
2. [ ] Remove `detailsRef` and `openIfHash` useEffect (or keep only scroll-into-view if desired)
3. [ ] Update header: remove `summary` semantics, cursor-pointer, details-marker hiding
4. [ ] Update E2E test: remove click step before form assertions
5. [ ] Manually verify: form visible on load, header link still scrolls to section, layout matches existing style

## Success Criteria

- Check-ins textarea, Today only checkbox, and Generate & Save button are visible on page load without any click
- Card styling (header, divider, padding) matches the previous expanded state
- Header "Build Summary" link still scrolls to the form section
- E2E tests pass
- No regression on mobile or xl layouts
