# Plan 36: Yesterday Summary

**Status: ✅ Complete** · **Priority: P1** · **Effort: Low** · **Impact: Medium**

## Problem

"Today" mode shows midnight-to-now. Users often want a quick "what did I do yesterday?" view for standups or catch-up—without running a full week.

## Tasks

1. [ ] Add `--yesterday` / `-y` flag to CLI: window = yesterday 00:00–23:59
2. [ ] Add "Yesterday" tab or toggle on index page alongside Today/Weekly
3. [ ] Reuse existing `runSummary` with new window; add `yesterdayMode` option to `getWindowStart`/`getWindowEnd`
4. [ ] Optional: keyboard shortcut (e.g. Y) to switch to yesterday view

## Success Criteria

- CLI: `pnpm cli --yesterday` returns yesterday's stats
- Web: User can view yesterday's metrics in one click
- Same UI as Today (TodaySection pattern)
