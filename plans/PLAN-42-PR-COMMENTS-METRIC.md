# Plan 42: PR Comments Metric

**Status: ✅ Complete** · **Priority: P2** · **Effort: Low** · **Impact: Medium**

## Problem

Stats include `pr_comments` in the Payload type but it's not surfaced in the UI. PR comments are a useful signal of code review depth and collaboration.

## Tasks

1. [x] Verify `pr_comments` is populated by `lib/summary.ts` (GitHub API)
2. [x] Add "PR comments" to WeeklyTicker and MetricsCard
3. [x] Add to trend badges if prev week available
4. [x] Include in copy-to-clipboard format
5. [x] Add to annual/charts aggregation if applicable

## Success Criteria

- PR comments visible in metrics cards
- Consistent with other metrics (icon, trend, copy)
