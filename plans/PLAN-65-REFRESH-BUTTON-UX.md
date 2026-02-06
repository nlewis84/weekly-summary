# PLAN-65: Refresh Button UX/UI Improvements

**Status:** ✅ Complete · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** Addresses poor UX/UI of the Refresh button—unclear feedback when clicked, missing cursor affordance, and weak loading state.

## Problem

1. **No clear feedback when clicked:** When the user clicks Refresh (or presses `r`), it's not obvious that anything is happening. The loader runs in the background; if the request is fast (e.g. cache hit) or the UI doesn't clearly indicate loading, the user may think the button did nothing.

2. **Missing cursor pointer on hover:** The Refresh button does not show `cursor: pointer` on hover, so it doesn't signal that it's clickable. This violates basic affordance expectations for interactive elements.

3. **Disabled state feels broken:** When `isLoading` is true, the button is `disabled` with `opacity-50`. This can look like the button is broken or inactive rather than "in progress."

4. **Loading state may be too subtle:** The Lottie "refresh" animation and "Refreshing…" text may not be prominent enough, especially if the refresh completes quickly or the user's attention is elsewhere.

## Affected Components

| File | Role |
|------|------|
| `app/components/RefreshButton.tsx` | Primary target—cursor, loading feedback, disabled styling |
| `app/routes/_index.tsx` | Passes `isLoading` from `revalidator.state`; may need to ensure loading state is visible during refresh |
| `app/routes/charts.tsx` | Uses RefreshButton; same loading wiring |

## Solution

### 1. Add `cursor-pointer` on Hover

- Add `cursor-pointer` to the Refresh button's `className`.
- When `disabled`, use `cursor-not-allowed` (or `cursor-wait` during loading) to indicate the button is temporarily non-interactive.

### 2. Improve Loading Feedback

- **Option A – Keep disabled, improve visuals:** When loading, show a clear spinning/animating state. Consider `cursor-wait` to signal "please wait." Ensure the Lottie animation is visible and recognizable.
- **Option B – Don't disable during load:** Keep the button enabled but show loading state. This avoids the "broken" feel of disabled+opacity. Risk: double-clicks could trigger multiple refreshes (mitigate with debounce or ignore while loading).
- **Option C – Skeleton/pulse on content:** In addition to button state, briefly show a subtle pulse or skeleton on the data area being refreshed so the whole section feels "in progress."

**Recommendation:** A + B: Add `cursor-pointer` (and `cursor-wait` when loading), and consider not disabling—or use a shorter disabled period. Add a subtle pulse/skeleton on the Today/Metrics content during refresh for clearer feedback.

### 3. Optional: Toast on Refresh Complete

- After a successful refresh, show a brief toast: "Data refreshed." This gives explicit confirmation when the refresh completes. (Requires toast system; app already has it.)

### 4. Ensure Loading State Propagates

- Verify that `revalidator.state === "loading"` is true for the full duration of the loader (including when `_bust` triggers a new request). If the loader resolves very quickly, consider a minimum display time for the loading state (e.g. 200ms) so the user sees the feedback.

## Tasks

1. [x] Add `cursor-pointer` to RefreshButton when not loading
2. [x] Add `cursor-wait` (or `cursor-not-allowed`) when loading
3. [x] Revisit disabled state: use `cursor-wait` and `opacity-75` (reads as "in progress" not "broken")
4. [x] Add subtle opacity (opacity-90) on refreshed content area during load (TodaySection, WeeklySection)
5. [x] Add toast "Data refreshed" on successful refresh (index + charts)
6. [ ] Verify loading state is visible for fast refreshes (min display time if needed) — deferred
7. [x] Update plans/README.md with Plan 65

## Success Criteria

- Refresh button shows `cursor: pointer` on hover when idle
- Refresh button shows appropriate cursor (e.g. `cursor-wait`) when loading
- User can clearly tell that a refresh is in progress
- Disabled/loading state does not feel "broken"
- No regressions in keyboard shortcut (`r`) or auto-refresh behavior
