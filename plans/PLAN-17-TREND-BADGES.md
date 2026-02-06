# Plan 17: Trend Badges on Metrics

**Status: ✅ Complete** · **Priority: P1** · **Effort: Medium** · **Impact: High**

## Problem

Metrics are static. Showing deltas vs last week (e.g. "↑ 2 more PRs") would add context and motivation.

## Tasks

1. [ ] Load previous week's payload when showing weekly metrics (or today vs yesterday for today mode)
2. [ ] Compute deltas for each metric (PRs merged, reviews, Linear completed, etc.)
3. [ ] Render trend badges: ↑ green, ↓ red/gray, — no change
4. [ ] Handle first week / no previous data gracefully
5. [ ] Optional: sparkline or mini trend indicator

## Success Criteria

- Metrics show week-over-week change where data exists
- UI is clear and not cluttered
