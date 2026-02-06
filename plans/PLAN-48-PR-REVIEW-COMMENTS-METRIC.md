# Plan 48: PR Review Comments (Code Review)

**Status: 🔲 Pending** · **Priority: P2** · **Effort: Low** · **Impact: Medium**

**Validated Feb 2026:** `pr_review_comments` not in `Stats`. `pr_comments` (Plan 42) exists for issue-level comments. Still relevant.

## Problem

`pr_comments` (Plan 42) counts issue-level comments on PRs. **Review comments** are different: inline code review feedback (e.g. "Consider using X here"). They signal depth of code review, not just discussion.

## Data Source

- **GitHub API**: `GET /repos/{owner}/{repo}/pulls/{pull_number}/comments` — review comments
- Or: `GET /search/issues` returns PRs; for each reviewed PR, fetch `repos/.../pulls/.../comments`
- Filter by `user.login === username` and `created_at` in window
- We already fetch `comments_url` (issue comments) for pr_comments; review comments use a different endpoint

## Tasks

1. [ ] Add `pr_review_comments` to `Stats` in `lib/types.ts`
2. [ ] In `lib/summary.ts`: for PRs user reviewed, fetch review comments endpoint; count those by user in window
3. [ ] Add to WeeklyTicker, MetricsCard (e.g. "Review comments" with Code icon)
4. [ ] Add to copy format, charts, annual
5. [ ] Consider rate limits: 1 request per reviewed PR; batch or limit to top N PRs

## Success Criteria

- PR review comments (inline code feedback) visible as separate metric
- Complements pr_comments (general discussion) and pr_reviews (PRs reviewed)
