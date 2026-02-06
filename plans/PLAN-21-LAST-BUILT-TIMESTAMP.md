# Plan 21: Last Built Timestamp

**Status: ✅ Complete** · **Priority: P0** · **Effort: Low** · **Impact: Medium**

## Problem

After building a summary, users may want to know when it was last generated. "Last built: 2 hours ago" with quick re-run would reduce ambiguity.

## Tasks

1. [x] Return timestamp from build-summary action (or derive from persisted file)
2. [x] Display "Last built: X ago" near the form or Build Summary section
3. [x] Store in localStorage or fetch from API when available
4. [ ] Optional: relative time updates (e.g. "2 min ago" → "3 min ago")

## Success Criteria

- User sees when the current week's summary was last built
- Display is unobtrusive and accurate

---

## Resolution

- API returns builtAt, weekEnding when saved
- FullSummaryForm shows "Last built: X ago (week ending Y)" from localStorage
- Persists across sessions
