# Plan 74: Remove Build Summary Button from Header

**Status: Draft**

Remove the "Build Summary" link/button from the header navigation. The Build Summary form remains on the index page; users will reach it by scrolling or via the keyboard shortcut `b`.

## Problem

The header currently includes a prominent "Build Summary" link (primary styling) that scrolls to `#build-summary`. If the form is always visible (per Plan 72) or otherwise discoverable, the header CTA may be redundant and add visual clutter.

## Current State

- **Header** (`app/root.tsx`): `Link` to `/#build-summary` between ThemeToggle and History
- **Form** (`app/routes/_index.tsx`): FullSummaryForm in a column with `id="build-summary"`
- **Shortcuts** (`ShortcutsHelp.tsx`): `b` still scrolls to Build Summary (keep)
- **E2E** (`e2e/navigation.spec.ts`): "Build Summary link scrolls to form" test

## Scope

### 1. Remove Header Link

| File | Changes |
|------|---------|
| `app/root.tsx` | Remove the `Link` to `/#build-summary` (lines 156–162). Keep ThemeToggle, History, Charts, Settings. |

### 2. Update E2E Tests

| File | Changes |
|------|---------|
| `e2e/navigation.spec.ts` | Remove the "Build Summary link scrolls to form" test; the link no longer exists. |

### 3. Optional / Unchanged

| Item | Notes |
|------|-------|
| `ShortcutsHelp.tsx` | Keep `b` shortcut; it still scrolls to Build Summary. No change. |
| `#build-summary` anchor | Keep on index; shortcut and direct URL `/#build-summary` still work. |
| `FullSummaryForm` hash handling | Keep `useEffect` that opens details when hash is `#build-summary`. |

## Implementation Order

1. Remove the Build Summary `Link` from `app/root.tsx`
2. Remove the "Build Summary link scrolls to form" test from `e2e/navigation.spec.ts`

## Verification

- [ ] Header shows ThemeToggle, History, Charts, Settings (no Build Summary)
- [ ] Navigate to `/#build-summary` still scrolls to form and opens details
- [ ] `b` shortcut still scrolls to Build Summary
- [ ] E2E tests pass
- [ ] Build succeeds

## Dependencies

- **Plan 72** (Build Summary Always Visible): If that plan ships, the form is always visible on the index; removing the header link further simplifies the header. This plan is independent—header link removal does not require Plan 72.

## Notes

- Plan 04 added the header link for discoverability. Removing it simplifies the nav; users can still reach Build Summary via scroll, URL, or `b`.
- Plan 59 (Intent Prefetch) references the Build Summary link; update that plan if it becomes outdated.
