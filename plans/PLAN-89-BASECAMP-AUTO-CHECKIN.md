# PLAN-89: Automated Basecamp daily check-in

## Goal

Clicking **Capture Today** with **Basecamp** checked produces the finished daily check-in: Grokbot-style bullets, real person tags, and a screenshot of the Today card under the list. The preview modal stays so Nathan can edit before posting, and it now shows the screenshot thumbnail and the resolved tags.

Today this takes six manual steps (screenshot, Grokbot, paste, post, reopen in Basecamp, add image, fix tags).

## Spike results (2026-11-11)

- `basecamp checkins answer create --attach <png>` uploads and embeds the image in one call.
- A mention is `<bc-attachment sgid="{person.attachable_sgid}" content-type="application/vnd.basecamp.mention"></bc-attachment>`. `basecamp people show <id> --json` returns `attachable_sgid` and `avatar_url`. `people list` does not.
- When the body contains any HTML, the CLI skips its markdown conversion. The body must be HTML: `<ul><li>…</li></ul>` then `<bc-attachment sgid="{image sgid}"></bc-attachment>`. That matches the stored HTML of past answers exactly.
- `basecamp attach <file> --json` returns the image's `attachable_sgid`. Update calls must re-include it or the image is lost.
- `claude -p --model haiku --allowedTools mcp__claude_ai_Slack__slack_search_public_and_private` reads Slack through Nathan's Claude Code login. About 11s and $0.007 per run.

## Flow

1. **Click (client).** Render the Today section to PNG with `modern-screenshot` (scale 2) *before* any state change, so the button still reads "Capture Today". Hold the blob in state. Filename: `Screenshot YYYY-MM-DD at h.mm.ss AM|PM.png`.
2. **Preview request (server, `previewBasecamp=true`).** Fetch the payload and Granola notes as now, load the roster, and call the writer. Return `{ ok, preview, draft, date, granolaWarning, writerNotes, roster, mentionRules }`. `roster` holds public fields only (id, name, firstName, avatarUrl), never sgids.
3. **Preview modal.** Show the editable textarea, a screenshot thumbnail, and a live rendered preview. The preview shows tags as avatar chips, plain names as text, and unresolved `@Name` as amber chips with a hint. `writerNotes` shows the same way `granolaWarning` does.
4. **Post (server).** Multipart form carries `checkInBody` and `screenshot`. The server resolves mentions, runs `basecamp attach`, builds the HTML, and creates the answer. If today's snapshot already has a `basecampAnswerId`, it updates that answer instead. The answer ID is saved in `.cache/basecamp-answers.json` (not `daily-snapshots/`, where every `*.json` is read as a payload). An update first checks the old answer is still active, so a trashed answer gets replaced by a new post.
5. **Fallback.** If `claude` is missing, times out (90s), or returns junk, the draft falls back to `formatSnapshotAsCheckIn` and the modal says why.

## Writer (`lib/checkin-writer.ts`)

- The prompt lives in `config/checkin-prompt.md`. It is the Grokbot daily rules word for word, minus the delivery section (SendToUser, chat-only, posting bans that no longer apply).
- Inputs in the prompt: today's payload (merged PRs, opened PRs, reviews, commits by repo, Linear done/worked/created titles), Granola titles and summaries, the taggable roster, the plain-name list, and Nathan's last 10 answers as plain text for tone.
- The model searches Slack itself (user `U022N4RTD40`, today in America/Chicago). Its only allowed tool is the read-only Slack search.
- The prompt caps bullets at 12 words. Without that cap, Haiku wrote run-on lines with "including …" clauses.
- Output contract: JSON `{ "bullets": string[], "notes": string }`. The draft is `bullets.map(b => "- " + b).join("\n")`.

## Mentions (`lib/checkin-mentions.ts`, `lib/basecamp-roster.ts`, `config/checkin-mentions.json`)

- Roster comes from people in `BASECAMP_PROJECT_ID`, plus `people show` for sgid and avatar. It is cached in `.cache/basecamp-roster.json` for 7 days.
- Matching order: full name (`@Heather Peters`), then a first name that is unique and not in `ambiguous`. Anything else is unresolved.
- Rules file:
  - `plain`: `Fowler`, `Michael`, `Heather F.`. These never get tagged, and a leading `@` is dropped.
  - `ambiguous`: `Heather` (Peters vs Heather F.), `Tyler` (Siegrist vs Vance). These need the full name to tag.
- On post, unresolved mentions go out as plain text with the `@` removed. The modal has already flagged them.
- `buildCheckInHtml(body, roster, rules, imageSgid)` HTML-escapes text, emits one `<li>` per `- ` line, inserts mention tags, and appends the image tag.

## Build

| Owner | Model / effort | Files |
|---|---|---|
| Agent A: UI | Sonnet, low | `TodaySection.tsx`, `BasecampCheckInPreviewDialog.tsx`, `package.json` (`modern-screenshot`) |
| Agent B: writer | Sonnet, medium | `lib/checkin-writer.ts` + test, `config/checkin-prompt.md` |
| Agent C: mentions | Haiku, low | `lib/checkin-mentions.ts` + test, `lib/basecamp-roster.ts`, `config/checkin-mentions.json` |
| Claude (main) | — | `api.snapshot.ts`, `basecamp-post.ts`, `daily-snapshot.ts`, integration, `pnpm test/typecheck/lint`, first real post with Nathan |

## Out of scope

- Posting with no review (revisit after a week of previews).
- The weekly summary post.
