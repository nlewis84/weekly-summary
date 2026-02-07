# Plan 73: Metrics Card View Details – Expand Only That Card

**Status:** Draft · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** When clicking "View details" on the Metrics card, the Build Weekly Summary and This Week cards also appear to expand because the grid stretches all columns to match the tallest. This plan fixes the layout so only the Metrics card expands.

## Problem

- **Current behavior:** Main page uses `xl:grid xl:grid-cols-[2fr_1fr_1fr] xl:items-stretch`. When the user clicks "View details" on the Metrics card, the card content grows (PRs merged, reviews, Linear issues, etc.). Because `items-stretch` makes all grid columns match the tallest row height, the Build Summary and This Week cards visually stretch to fill the same height.
- **Perceived issue:** It looks like all three cards expanded when only the Metrics card content expanded.
- **Desired behavior:** Clicking "View details" should expand only the Metrics card. Build Summary and This Week cards should keep their natural heights and not stretch.

## Root Cause

In `app/routes/_index.tsx` line 205:

```tsx
<div className="xl:grid xl:grid-cols-[2fr_1fr_1fr] xl:gap-5 xl:items-stretch">
```

`xl:items-stretch` (default for CSS grid) causes all three columns to stretch to the height of the tallest cell. When the Metrics card expands, the left column becomes taller, so the grid stretches the middle and right columns to match.

## Affected Files

| File | Role |
|------|------|
| `app/routes/_index.tsx` | Change grid alignment from `xl:items-stretch` to `xl:items-start` |

## Solution Approach

Use `xl:items-start` instead of `xl:items-stretch` so columns align to the top and do not stretch to match each other. Each column will have its natural height based on its content:

- **Metrics column:** Grows when "View details" is expanded; shrinks when collapsed.
- **Build Summary column:** Keeps its natural height (form, textarea, buttons).
- **This Week column:** Keeps its natural height (WeeklyTicker cards).

## Implementation Details

### `app/routes/_index.tsx`

**Before:**
```tsx
<div className="xl:grid xl:grid-cols-[2fr_1fr_1fr] xl:gap-5 xl:items-stretch">
```

**After:**
```tsx
<div className="xl:grid xl:grid-cols-[2fr_1fr_1fr] xl:gap-5 xl:items-start">
```

### Trade-off

- **PLAN-64 (Card Consistency)** previously ensured Build Summary and This Week cards align in height via `items-stretch`. Switching to `items-start` means those two cards may no longer match in height when the Metrics card is collapsed.
- **Acceptable:** The user explicitly wants Metrics expansion to be isolated. Build Summary and This Week will each have their natural height; they may differ slightly depending on content.
- **Optional polish:** If Build Summary and This Week alignment is still desired, we could add `xl:min-h-[...]` or `xl:self-stretch` to those two columns only (not the Metrics column), but that would require more investigation.

## Tasks

1. [ ] Change `xl:items-stretch` to `xl:items-start` in `app/routes/_index.tsx`
2. [ ] Manually verify: Click "View details" on Metrics card → only Metrics card expands; Build Summary and This Week stay at their natural heights
3. [ ] Verify layout on mobile/tablet (no change expected; grid only applies on xl)
4. [ ] Verify sticky behavior of Build Summary card still works when scrolling (if content extends below fold)

## Success Criteria

- Clicking "View details" on the Metrics card expands only that card
- Build Summary and This Week cards do not stretch when Metrics details expand
- No regression on mobile or tablet layouts
- Sticky Build Summary card (if applicable) still behaves correctly
