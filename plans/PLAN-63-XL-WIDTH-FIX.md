# Plan 63: XL Screen Width Fix

**Status:** ✅ Complete · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** Fixes "too wide on xl screens" by constraining only the Build Summary card and ensuring flex parents don't stretch it. Reverts over-constraint of Metrics and This week cards per Plan 61.

## Problem

1. **Build Summary card stretches** on xl screens despite `xl:w-96`—the FullSummaryFormContainer wrapper uses `xl:flex xl:flex-col` with default `align-items: stretch`, so the details element stretches to fill the column width instead of respecting `w-96`.

2. **Over-constrained layout**—applying fixed width to all three cards and changing the grid to `24rem 24rem` makes the two-column section too narrow and doesn't align with Plan 61's "use horizontal space" approach.

## Solution

1. **Build Summary only**: Keep `xl:w-96` on the Build Summary card but fix the flex stretch. Add `xl:items-start` to FullSummaryFormContainer wrapper so the card uses its intrinsic width instead of stretching.

2. **Revert Metrics and This week**: Remove `xl:w-96` from MetricsCard and WeeklyTicker. Restore flexible layout per Plan 61.

3. **Restore grid**: Change grid back to `xl:grid-cols-[1.5fr_1fr]` so the left column (Metrics) uses space; the right column will contain the fixed-width Build Summary card left-aligned.

## Affected Files

| File | Change |
|------|--------|
| `app/components/FullSummaryFormContainer.tsx` | Add `xl:items-start` to wrapper so card doesn't stretch |
| `app/components/MetricsCard.tsx` | Remove `xl:w-96` |
| `app/components/WeeklyTicker.tsx` | Remove `xl:w-96` |
| `app/routes/_index.tsx` | Restore `xl:grid-cols-[1.5fr_1fr]`; add `xl:items-start` to right column |

## Tasks

1. [x] Add `xl:items-start` to FullSummaryFormContainer wrapper
2. [x] Add `xl:items-start` to right column in _index.tsx
3. [x] Restore grid to `xl:grid-cols-[1.5fr_1fr]`
4. [x] Remove `xl:w-96` from MetricsCard
5. [x] Remove `xl:w-96` from WeeklyTicker
6. [x] Update plans/README.md
