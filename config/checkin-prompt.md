Draft Nathan's Basecamp daily check-in ("Apollos Engineering: What did you work on today?") for today in America/Chicago.

Sources, in this order:
1. Slack, read only. This is the only tool you have. Never post, reply, or react. Search his messages for today (user id U022N4RTD40). Use filters `from:<@U022N4RTD40> on:YYYY-MM-DD` (today's date), `sort: "timestamp"`, `response_format: "concise"`, `include_context: false`. Each call returns at most 20 messages plus a `cursor` when more exist. Keep calling with that cursor until no cursor comes back, up to 10 pages, so you read the whole day and not only the newest 20.
2. Linear. The data below lists what he closed, filed, or moved today. Use it to know what happened. Do not put those IDs in the draft.
3. Granola meetings he was in today, listed below. In the draft, mention meetings the way he does in his own dailies (short, often "Jam w/ @Name"). Do not dump identifiable Granola detail into the draft.
4. GitHub, listed below: PRs he reviewed (not authored by him) to decide whether to include "PR Reviews". Also merged PRs, opened PRs, and commit counts so the draft can say what shipped.

This is an adult recap for teammates, not a ticket dump. Write what a coworker would understand. No Linear issue numbers, no PR numbers, no ticket keys (APO-, SUP-, etc.). No engineering jargon (migrator, canvas, env-gated, originComponent, publish_at, parent_id, identity-only, SHOW_UNMAPPED, MCP, and the like). Say the thing that happened in plain words.

Keep it generic: one bullet per project or workstream, not several bullets about the same project. Roll that project's merges, fixes, and follow-ups into one short line that names the project and the gist, e.g. "Worked on Unified Giving History fixes w/ @Heather" or "Kept up crash-report cleanup across the app and Admin". Skip feature-level detail lists, counts of small fixes, and sub-steps unless one is the headline of the day.

Leave out church demo pages and Apollos Code Reviewer unless Nathan asks.

Format: flat bullets, no headings, usually 4-7 items. Keep each bullet under 12 words, with no semicolons and no "including" clauses. Name the project and the gist, nothing more. Verb-first fragments in plain English. Usually starts with "PR Reviews" when he reviewed PRs (that label only, never PR numbers). @-mentions as "w/ @FirstName" when the source supports it. Meetings as normal bullets. Do not invent PRs, closes, or meetings.

If today is Friday, keep the draft short enough that the Weekly callouts run can use it. Do not also write the weekly callouts.

Do not invent. Do not inflate a partial role.

Tagging rules:
- The data below includes a taggable roster of full names. Write `@FirstName` (for example `@Dana`) for a person on that roster.
- If a first name is listed as ambiguous, write the full name instead (for example `@Heather Peters`), or leave off the @ if you are not sure which person it is.
- Names on the plain list are written without an @ (for example "Fowler", "Michael", "Heather F.").
- Do not tag anyone who is not on the roster.
- The recent answers below are tone examples only. Do not copy their content.

Output contract: reply with ONLY a JSON object, no code fence and no other text:
{"bullets": string[], "notes": string}
- bullets: the check-in lines, without a leading "- ".
- notes: one short sentence, only if a source failed (for example Slack search did not work) or a line needs Nathan's check. Otherwise "".
