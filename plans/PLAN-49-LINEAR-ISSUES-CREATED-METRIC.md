# Plan 49: Linear Issues Created

**Status: 🔲 Pending** · **Priority: P2** · **Effort: Low** · **Impact: Medium**

## Problem

We track issues completed and worked on (as assignee). **Issues created** is different: it signals ownership, initiative, and backlog contribution—who's creating work for the team.

## Data Source

- **Linear GraphQL**: `issues(filter: { creator: { id: { eq: $userId } }, createdAt: { gte: $windowStart, lte: $windowEnd } })`
- Single query; we already have userId from viewer query
- Paginate if > 100

## Tasks

1. [ ] Add `linear_issues_created` to `Stats` in `lib/types.ts`
2. [ ] Add Linear GraphQL query for issues created by viewer in window
3. [ ] Implement in `lib/summary.ts` alongside existing Linear fetches
4. [ ] Add to WeeklyTicker, MetricsCard (e.g. "Issues created")
5. [ ] Add to copy format, charts, annual

## Success Criteria

- Linear issues created visible in metrics
- One additional Linear query per summary run
- Complements completed/worked-on (assignee view) with creator view
