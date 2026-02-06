# Plan 52: Commits Pushed Stat Not Populating

**Status: 🔲 Pending** · **Priority: P2** · **Effort: Medium** · **Impact: High**

## Problem

The `commits_pushed` stat is not populating correctly in `.md` or `.json` weekly summary files. Observed:

- **2026-02-07.json**: `commits_pushed: 0` despite 8 merged PRs and active development
- **2026-01-16.json**: No `commits_pushed` in stats at all (transcript-sourced)
- Charts, MetricsCard, and markdown all expect this field

## Root Cause Analysis

### 1. GitHub Events API limitations (current implementation)

`lib/summary.ts` uses `GET /users/{username}/events?per_page=100` to fetch PushEvents and sum `payload.commits.length`.

**Issues:**

- **30-day limit**: GitHub docs state: *"Only events created within the past 30 days will be included."* (Not 90 days as PLAN-45 assumed.)
- **No pagination**: Code fetches only the first 100 events. Events are returned most-recent-first and include PRs, reviews, comments, PushEvents, etc. With high activity, PushEvents for a given week can be buried beyond page 1.
- **Payload structure**: PushEvent payload may omit `commits` in some cases (e.g. size limits). The Events API example in docs shows a PushEvent without a `commits` array.

### 2. Transcript flow never populates commits

`lib/transcript-parse.ts`:

- `DEFAULT_STATS` does **not** include `commits_pushed`
- `extractStats()` has no regex for "X commits" in transcript text
- Transcript-sourced summaries (e.g. 2026-01-16) therefore have no commits field

### 3. Markdown fallback

`lib/markdown.ts` uses `stats.commits_pushed ?? 0`, so missing field renders as 0. That’s fine for display but doesn’t fix the data.

## Data Sources

| Source | Pros | Cons |
|--------|------|------|
| **Events API** (`/users/{user}/events`) | 1 request, includes all repos | 30-day limit, no pagination in our code, PushEvents can be diluted by other events |
| **Repo Commits API** (`/repos/{owner}/{repo}/commits?author=...&since=...&until=...`) | Accurate, supports date range, no 30-day limit | N requests (one per repo) |

## Recommended Fix

### Phase 1: Switch to Repo Commits API (primary)

1. In `lib/summary.ts`, replace or augment `fetchCommitsPushed` to use the Repo Commits API.
2. Use `stats.repos` (or a config like `GITHUB_COMMIT_REPOS`) to know which repos to query.
3. For each repo: `GET /repos/ApollosProject/{repo}/commits?author={username}&since={windowStartISO}&until={windowEndISO}&per_page=100`
4. Paginate if needed; sum commit count across repos.
5. Fallback: if no repos configured, keep Events API as fallback (with pagination) for the last 30 days.

### Phase 2: Transcript support

1. Add `commits_pushed: 0` to `DEFAULT_STATS` in `lib/transcript-parse.ts`.
2. Add regex in `extractStats()` for patterns like "X commits", "X commits pushed", "pushed X commits".
3. Ensure transcript-sourced payloads always have the field (even if 0).

### Phase 3: Events API improvements (optional)

If keeping Events API as fallback:

1. Paginate through events until `created_at` is before `windowStart` or we hit the 30-day boundary.
2. Handle missing `payload.commits` (e.g. count 1 per PushEvent when commits array absent).

## Curl Commands for Historical Data

You can run these to verify and backfill commits. Replace `$GITHUB_TOKEN` and `nlewis84` as needed.

### 1. Inspect Events API (debug why current approach returns 0)

```bash
# See PushEvents in your recent activity
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/users/nlewis84/events?per_page=100" \
  | jq '[.[] | select(.type=="PushEvent")] | length'

# Inspect first few PushEvents (check payload.commits)
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/users/nlewis84/events?per_page=100" \
  | jq '[.[] | select(.type=="PushEvent")][0:3] | .[] | {created_at, type, payload}'
```

### 2. Repo Commits API (reliable historical counts)

For a given week, e.g. 2026-01-31 → 2026-02-07:

```bash
# apollos-admin
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/ApollosProject/apollos-admin/commits?author=nlewis84&since=2026-01-31T00:00:00Z&until=2026-02-07T23:59:59Z&per_page=100" \
  | jq 'length'

# apollos-cluster
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/ApollosProject/apollos-cluster/commits?author=nlewis84&since=2026-01-31T00:00:00Z&until=2026-02-07T23:59:59Z&per_page=100" \
  | jq 'length'

# apollos-platforms
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/ApollosProject/apollos-platforms/commits?author=nlewis84&since=2026-01-31T00:00:00Z&until=2026-02-07T23:59:59Z&per_page=100" \
  | jq 'length'

# git-for-sql
curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/ApollosProject/git-for-sql/commits?author=nlewis84&since=2026-01-31T00:00:00Z&until=2026-02-07T23:59:59Z&per_page=100" \
  | jq 'length'
```

Sum the four `length` outputs for total commits in that week. If any repo returns 100, paginate with `&page=2`, etc.

### 3. One-liner to sum all repos for a week

```bash
WEEK_START="2026-01-31T00:00:00Z"
WEEK_END="2026-02-07T23:59:59Z"
USER="nlewis84"
for repo in apollos-admin apollos-cluster apollos-platforms git-for-sql; do
  n=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/repos/ApollosProject/$repo/commits?author=$USER&since=$WEEK_START&until=$WEEK_END&per_page=100" | jq 'length')
  echo "$repo: $n"
done
```

## Tasks

- [ ] Run curl commands above to confirm Repo Commits API returns non-zero counts for recent weeks
- [ ] Implement `fetchCommitsPushed` using Repo Commits API in `lib/summary.ts`
- [ ] Add `commits_pushed` to `DEFAULT_STATS` and `extractStats()` in `lib/transcript-parse.ts`
- [ ] Add optional Events API fallback with pagination (if desired)
- [ ] Add/update tests in `lib/summary.test.ts`
- [ ] Consider backfill script for existing JSON files (optional)

## Success Criteria

- `commits_pushed` shows non-zero values for weeks with commit activity
- Transcript-sourced summaries include `commits_pushed` (extracted or 0)
- Historical weeks (beyond 30 days) can be populated via Repo Commits API

## References

- [GitHub Events API](https://docs.github.com/en/rest/activity/events) — 30-day limit, 300 events max
- [GitHub List Commits API](https://docs.github.com/en/rest/commits/commits#list-commits) — `author`, `since`, `until` params
- [PLAN-45-COMMITS-METRIC.md](PLAN-45-COMMITS-METRIC.md) — Original commits metric plan
