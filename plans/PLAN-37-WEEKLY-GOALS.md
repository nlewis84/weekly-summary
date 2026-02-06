# Plan 37: Weekly Goals / Targets

**Status: ✅ Complete** · **Priority: P1** · **Effort: Medium** · **Impact: High**

## Problem

Users have no way to set goals (e.g. "20 PR reviews this week") and see progress. Adding optional targets would support accountability and planning.

## Tasks

1. [ ] Add goals UI in Settings or on index: PRs merged, PR reviews, Linear completed (optional numbers)
2. [ ] Persist in localStorage or a simple `goals.json` in repo (user choice)
3. [ ] Show progress in WeeklyTicker / MetricsCard: e.g. "12/20 reviews" with a subtle progress bar or badge
4. [ ] Optional: "Goal met" indicator when target is reached
5. [ ] Goals reset weekly (or user can clear)

## Success Criteria

- User can set optional targets for key metrics
- Progress is visible at a glance
- Non-intrusive when no goals are set
