# Plan: Card Expand Isolation and Build Summary Hover Effect

**Status: ✅ Complete** · **Supersedes: PLAN-73**

## Problem

1. Clicking "View details" in the Metrics card caused Build Weekly Summary and This Week cards to stretch vertically because the grid used `xl:items-stretch`.
2. Build Weekly Summary card was missing the hover shadow effect that Metrics and This Week cards had.

## Changes

### Grid alignment (`app/routes/_index.tsx`)

Changed `xl:items-stretch` to `xl:items-start` so each column keeps its natural height and only the Metrics card expands when details are toggled.

### Hover shadow (`app/components/FullSummaryForm.tsx`)

Added `hover:shadow-(--shadow-skeuo-card-hover)` and `transition-all duration-300` to the Build Summary `<details>` element, matching Metrics and This Week cards.

### Cleanup

- Removed `xl:h-full` from MetricsCard and WeeklyTicker (no longer meaningful under `items-start`).
- Removed `xl:flex-1` from FullSummaryForm (unnecessary without stretch).

## Files changed

| File | Change |
|------|--------|
| `app/routes/_index.tsx` | `xl:items-stretch` -> `xl:items-start` |
| `app/components/FullSummaryForm.tsx` | Added hover shadow + transition, removed `xl:flex-1` |
| `app/components/MetricsCard.tsx` | Removed `xl:h-full` |
| `app/components/WeeklyTicker.tsx` | Removed `xl:h-full` |
