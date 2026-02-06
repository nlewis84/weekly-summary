# Plan 44: Compare Years (Annual)

**Status: ✅ Complete** · **Priority: P2** · **Effort: Medium** · **Impact: Medium**

## Problem

Annual dashboard shows one year. Users doing year-over-year reviews (e.g. 2024 vs 2025) want to compare totals and trends side by side.

## Tasks

1. [ ] Add year selector to annual page: "Compare with" dropdown (e.g. 2024 vs 2025)
2. [ ] When two years selected: show side-by-side totals (PRs, reviews, Linear, repos)
3. [ ] Optional: delta badges (+X% or -X% year over year)
4. [ ] Reuse `getAnnualData` for both years; aggregate comparison in loader
5. [ ] Link from annual page; could be `/history/annual?compare=2024` or similar

## Success Criteria

- User can compare two years' aggregate metrics
- Clear visual diff (side-by-side or delta)
- Supports annual review and planning use cases
