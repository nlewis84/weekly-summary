# PLAN-90: Automated Basecamp weekly callouts

## Goal

**Generate & Save** with **Post to Basecamp** checked saves the summary as now, then opens a preview of the finished weekly post: "Callouts for:" plus 3 highlighted callouts with real tags, plus two screenshots. **Post** sends it to "Apollos Engineering: What did you get done this week?". This replaces the old `buildBasecampSummary` dump, which Nathan stopped posting in late September 2026.

## Target format (from Nathan's posts since 2026-09-25)

```html
<p>Callouts for:</p>
<ul>
  <li><mark style="color: var(--highlight-3);background-color: var(--highlight-bg-3);"><strong>Unified Giving History</strong></mark><strong>:</strong> Cut … w/ Heather and Michael</li>
  … (3 callouts, distinct highlight colors 1-9)
</ul>
<bc-attachment sgid="{week page}"></bc-attachment><p><br></p><bc-attachment sgid="{goal rings}"></bc-attachment>
```

Editable text in the modal:

```
Callouts for:
- **Unified Giving History**: Cut … w/ Heather and Michael
```

## Flow

1. `/api/summary` with save + postToBasecamp saves to GitHub as now, then:
   - captures two screenshots server-side with Playwright (dark mode, 2x): the top of `/history/<week>` (header, Project Shipped card, Metrics), then the "This week" goal rings card on `/`. Files go in `.cache/weekly-shots/<week>/`, named like macOS screenshots. The request's Cookie header is forwarded to the headless browser, because the goal rings only render from the `weekly-summary-goals` cookie. The rings card always shows the current week, so post on the Friday of the week.
   - writes callouts with `claude -p --model sonnet` (Slack search tool only). Inputs: the week's daily check-ins from Basecamp, the weekly payload, Granola for the week, roster/rules.
   - returns `basecampPreview: WeeklyBasecampPreview` (thumbnails as data URLs).
2. The modal shows the text, the live preview with tag chips, and both thumbnails. Saving already happened, so it has no "Save without posting" button.
3. **Post** sends `POST /api/weekly-post { weekEnding, body }`. The server resolves tags, attaches the cached screenshots, builds the HTML, and creates the answer (or updates the week's answer in place).

## Writer rules

These come from Grokbot's weekly prompt, its weekly-callouts skill, and its saved notes (2026-11-11). They live in `config/weekly-callouts-prompt.md`:

- Exactly 3 callouts, one per project. Rank: production fixes > shipped/customer-visible > unblocking someone > bugs caught early > team leverage > early shaping.
- Each is a bold theme, a colon, and 5-25 words with past-tense shipping verbs. Show reach and who the work helps, with real counts only when a source states them. Never count PRs, reviews, or merges.
- Leave out PR reviews, 1:1s, retros, ceremonies, Code Reviewer, church demo pages, Chat v2/Vitor topics, ticket/PR numbers, and jargon. Say "crash reports", not Sentry.
- People: `w/ @FirstName` only when a source shows they worked on it. If sources disagree on a name, drop it. Heather Fowler (Giving History) is plain text, and so are Fowler and Michael.
- OOO or short week: the last callout can be a short-week note when it's a real fact.
- Granola stays private: no meeting details or identifiable attendees.

## Build

| Owner | Model / effort | Files |
|---|---|---|
| Agent: screenshots | Sonnet, low | `lib/weekly-screenshots.ts` |
| Agent: preview UI | Sonnet, low | `FullSummaryForm.tsx`, `FullSummaryFormContainer.tsx`, `BasecampCheckInPreviewDialog.tsx` |
| Claude (main) | — | writer + prompt, `buildWeeklyCalloutsHtml`, `api.summary.ts`, `api.weekly-post.ts`, `basecamp-post.ts` |
