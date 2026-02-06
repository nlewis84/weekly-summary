# Plan 34: Configurable Refresh Interval

**Status: ✅ Complete** · **Priority: P0** · **Effort: Low** · **Impact: Medium**

## Problem

The index page auto-refreshes every 5 minutes. Some users may want a different interval (e.g. 10 min, 30 min) or to disable auto-refresh entirely. Currently this is hardcoded. Must stay within GitHub/Linear rate limits.

## Rate Limit Constraints

- **GitHub**: 5,000 requests/hour (authenticated). Index load = ~5–10 requests (today + weekly + prev week). At 5 min: ~60 loads/hour → ~600 requests max. Safe.
- **Linear**: No strict published limit; typical 100–200 req/min. Same order as GitHub.
- **Minimum interval**: 5 min (default) keeps us well under limits. Do not offer 1 min or 2 min.
- **Recommended options**: 5 min, 10 min, 30 min, Off

## Tasks

1. [x] Add refresh interval setting to Settings page: 5 min (default), 10 min, 30 min, Off
2. [x] Persist choice in localStorage (e.g. `weekly-summary-refresh-interval`)
3. [x] Read interval in `_index.tsx`; only start `setInterval` when not "Off"
4. [x] Show current interval in UI (e.g. "Refreshes every 5 min" near Refresh button)
5. [x] Enforce minimum 5 min in code (reject lower values if ever added later)

## Success Criteria

- User can choose refresh interval or disable auto-refresh
- Setting persists across sessions
- Manual refresh (R key, button) always works regardless of interval
- All offered intervals keep API usage under rate limits
