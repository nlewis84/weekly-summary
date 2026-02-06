# Plan 45: Commits Pushed (GitHub)

**Status: ✅ Complete** · **Priority: P2** · **Effort: Medium** · **Impact: Medium**

## Problem

We track PRs and reviews but not raw commit activity. Commits pushed is a direct signal of coding output and complements PR metrics (e.g. small fixes, internal commits).

## Data Source

- **GitHub Events API**: `GET /users/{username}/events` returns `PushEvent` with `payload.commits` array
- Filter by `created_at` within window; sum commits across PushEvents
- Events API returns last 90 days; sufficient for weekly/today
- Alternative: iterate repos from `GITHUB_REPO` or user's repos and call `GET /repos/{owner}/{repo}/commits?author={username}&since={iso}` — more accurate but more API calls

## Tasks

1. [ ] Add `commits_pushed` to `Stats` in `lib/types.ts`
2. [ ] Implement fetch in `lib/summary.ts`: Events API or repo commits
3. [ ] Add to WeeklyTicker, MetricsCard, copy format, charts, annual
4. [ ] Consider rate limits: Events API = 1 request; repo commits = N repos

## Success Criteria

- Commits pushed visible in metrics
- Accurate for configured repos or Events API fallback
