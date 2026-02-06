# Plan 05: Productivity Features

**Status: ✅ Complete**

## Problem

Identify and add functionality that would make the app more useful for productivity workflows.

## Potential Features

### High Value

| Feature | Description | Effort |
|---------|-------------|--------|
| **Copy to clipboard** | One-click copy of summary markdown or stats to clipboard | Low |
| **Export** | Export as PDF, or download .md/.json | Medium |
| **Keyboard shortcuts** | e.g. `r` refresh, `b` build summary, `?` help | Low |
| **Quick stats copy** | Copy "PRs merged: 3, Reviews: 5…" for standup/slack | Low |

### Medium Value

| Feature | Description | Effort |
|---------|-------------|--------|
| **Check-in templates** | Preset templates (e.g. "PR reviews", "Feature work") | Medium |
| **Last generated** | Show "Last built: 2 hours ago" with quick re-run | Low |
| **Trend badges** | "↑ 2 more PRs than last week" on metrics | Medium |
| **Notifications** | Reminder to build summary (e.g. Friday afternoon) | High |

### Lower Priority

| Feature | Description | Effort |
|---------|-------------|--------|
| **Calendar integration** | Add summary to Google Calendar / iCal | High |
| **Slack/Teams post** | Post summary to channel (removed per Plan 56) | — |
| **Bulk export** | Export multiple weeks at once | Medium |

## Recommended First Batch

1. **Copy stats to clipboard** – Button on MetricsCard / TodaySection
2. **Copy full markdown** – Button after generating (or on week detail page)
3. **Keyboard shortcut** – `r` to refresh data
4. **Last built timestamp** – Store in localStorage or from API, show near form

## Tasks

1. [ ] Add "Copy stats" button to TodaySection and/or MetricsCard
2. [ ] Add "Copy markdown" on week detail page and after successful build
3. [ ] Implement `r` keyboard shortcut for refresh (with `useEffect` + keydown)
4. [ ] Add "Last built" display (from summary action response or localStorage)
5. [ ] Document shortcuts in UI (e.g. tooltip or `?` modal)

## Success Criteria

- Users can quickly copy metrics for standups/slack
- Power users can use keyboard for refresh
- Clear feedback when copy succeeds (toast or inline message)

---

## Resolution

- **Copy stats** button on MetricsCard – copies one-liner for standup/slack
- **Copy markdown** button on History week detail – copies full summary markdown
- **Keyboard shortcut** `r` to refresh data (index page, skips when in input/textarea)
- Extracted `buildMarkdownSummary` to `lib/markdown.ts` (client-safe, no node deps)
- Refresh button tooltip: "Refresh data (r)"
