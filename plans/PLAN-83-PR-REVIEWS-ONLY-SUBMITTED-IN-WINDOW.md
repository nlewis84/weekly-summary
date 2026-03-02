# Plan: PR reviews only when you actually reviewed in the window

## Problem

"PR reviews" for Today (and Yesterday/Weekly) include PRs that the user **previously** reviewed but that had **other activity** in the window (e.g. new commit, someone else commented). Those PRs show up because the current logic uses GitHub search:

- `reviewed-by:${username}+type:pr+updated:>=${since}`

So any PR that was (1) ever reviewed by the user and (2) **updated** in the window appears in the count, even if the user did not comment, request changes, or approve in that window.

## Desired behavior

**PR reviews** should only include PRs where the user performed a review action **in the time window**:

- Comment (review body or review comments)
- Request changes
- Approve

So: filter by **when the user’s review was submitted**, not when the PR was updated.

## Approach

1. **Keep** the existing search to get a **candidate** set of PRs: `reviewed-by:${username}+type:pr+updated:>=${since}` (avoids missing PRs where we did review today).
2. **For each candidate PR**, call the GitHub API to list reviews:
   - `GET {pull_request.url}/reviews` (e.g. `GET /repos/owner/repo/pulls/123/reviews`).
3. **Filter** those reviews to:
   - `user.login === username`
   - `submitted_at` within the window (`windowStart <= submitted_at <= windowEnd`).  
   - Ignore `PENDING` reviews (no `submitted_at`).
4. **Include** the PR in the "reviews" list only if it has **at least one** such review.

## Implementation

- In `lib/summary.ts`, after fetching `reviewsData.items`:
  - Add a helper (e.g. `filterReviewsBySubmittedInWindow`) that:
    - Takes: candidate PRs, `windowStart`, `windowEnd`, `username`, `headers`.
    - For each PR with `pull_request?.url`, fetches `pull_request.url + '/reviews'`.
    - Keeps PRs that have at least one review by `username` with `submitted_at` in `[windowStart, windowEnd]`.
  - Replace `const reviews = filterApollosPRs(reviewsData.items ?? []);` with: filter Apollos PRs first, then run the new “submitted in window” filter.
- Use the same window (`windowStart`, `windowEnd`) already passed into `fetchGitHubData` so Today, Yesterday, and Weekly all behave correctly.

## Edge cases

- **Rate limits**: One extra request per candidate PR (typically &lt;20). Acceptable; no pagination of reviews needed for small counts.
- **PR without pull_request.url**: Skip (shouldn’t happen for search results that are PRs).
- **API failure for one PR**: Treat as “no review in window” for that PR (don’t include it).

## Files to change

- `lib/summary.ts`: add helper, wire it into `fetchGitHubData`.

## Acceptance

- Today’s “PR reviews” count and list only include PRs where the user submitted a review (comment / request changes / approve) today.
- Yesterday and Weekly windows only count reviews submitted in their respective windows.
