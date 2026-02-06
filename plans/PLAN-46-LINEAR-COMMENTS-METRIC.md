# Plan 46: Linear Issue Comments

**Status: 🔲 Pending** · **Priority: P2** · **Effort: Medium** · **Impact: Medium**

## Problem

We track Linear issues completed and worked on but not comments. Comments signal collaboration, async communication, and context-sharing on issues.

## Data Source

- **Linear GraphQL**: `comments` query with filter `user: { id: { eq: $userId } }, createdAt: { gte: $windowStart } }`
- Or: `Comment` model linked to issues; filter by creator
- Single query with pagination

## Tasks

1. [ ] Add `linear_comments` to `Stats` in `lib/types.ts`
2. [ ] Add Linear GraphQL query for comments by viewer in date window
3. [ ] Implement in `lib/summary.ts` alongside existing Linear fetches
4. [ ] Add to WeeklyTicker, MetricsCard, copy format, charts, annual
5. [ ] Update transcript parser default if applicable

## Success Criteria

- Linear comments count visible in metrics
- One additional Linear API call per summary run
