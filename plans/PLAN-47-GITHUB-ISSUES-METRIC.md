# Plan 47: GitHub Issues Opened/Closed

**Status: 🔲 Pending** · **Priority: P2** · **Effort: Low** · **Impact: Medium**

## Problem

We track PRs but not plain issues. Many teams use issues for bugs, tasks, and planning. Issues opened and closed complement PR metrics.

## Data Source

- **GitHub Search API**: `author:${username} type:issue created:>=${since}` and `author:${username} type:issue closed:>=${since}`
- Same pattern as existing PR search; minimal new code
- Filter by org/repo if needed (e.g. ApollosProject)

## Tasks

1. [ ] Add `issues_opened` and `issues_closed` to `Stats` in `lib/types.ts`
2. [ ] Add search queries in `lib/summary.ts` (parallel with existing PR fetches)
3. [ ] Add to WeeklyTicker, MetricsCard (compact: "Issues opened/closed")
4. [ ] Add to copy format, charts, annual
5. [ ] Optional: combine into single "Issues" metric (opened + closed) if UI is crowded

## Success Criteria

- Issues opened and closed visible in metrics
- Uses existing search pattern; 2 extra search requests per run
