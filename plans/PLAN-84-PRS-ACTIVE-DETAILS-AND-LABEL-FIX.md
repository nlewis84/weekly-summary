# Plan: PRs Active Details and Metric Label Truncation Fix

**Status: ✅ Complete**

## Problem

1. The "View details" expandable section in the Metrics card was missing a detail list for PRs created/updated — the count showed in the grid but there was no breakdown when expanding.
2. Several metric button labels were truncated with ellipsis: "PRs created/up...", "Linear issues c...", "Linear issues w...", "Linear issues cr...".

## Changes

### Part 1 — PRs active detail section

- Added `open_prs` field to `Payload.github` type in `lib/types.ts`
- Built `open_prs` from `prCategories.open` in `lib/summary.ts` payload construction (non-merged PRs only, avoids duplicating the merged list)
- Added "PRs active" detail block in `MetricsCard.tsx` View Details, following the same pattern as PRs merged (title, link, repo)
- Updated `hasDetails` guard to include `open_prs`

### Part 2 — Shortened metric labels

| Before | After | Tooltip on hover |
|--------|-------|-----------------|
| PRs created/updated | PRs active | PRs created or updated |
| Commits pushed | Commits | Commits pushed |
| Linear issues completed | Linear done | Linear issues completed |
| Linear issues worked on | Linear active | Linear issues worked on |
| Linear issues created | Linear created | Linear issues created |

Detail section headers updated to match. Full descriptive text preserved as `title` tooltip on hover.

## Files changed

| File | Change |
|------|--------|
| `lib/types.ts` | Added `open_prs` to `Payload.github` |
| `lib/summary.ts` | Built `open_prs` from `prCategories.open` in payload |
| `app/components/MetricsCard.tsx` | Shortened labels, added tooltip field, added PRs active detail block, updated `hasDetails` guard |
