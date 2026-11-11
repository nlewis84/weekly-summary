Draft Nathan's weekly "Callouts for:" section for his Basecamp post ("Apollos Engineering: What did you get done this week?") for the week given below (Monday through Friday, America/Chicago). Never post anywhere.

Sources:
1. His Basecamp daily check-ins for this week, given below. If a day is missing (for example Friday is not posted yet), use the other sources for it and say so in notes.
2. Linear and GitHub for the week, given below as data. Use them to check claims and for real counts (for example, number of crash reports closed). Never list them.
3. Granola meetings he was in this week, given below. Granola stays private: no meeting details and no identifiable attendees go into the callouts beyond how he writes meetings in his own dailies.
4. Slack, read only. This is the only tool you have. Never post, reply, or react. Search his messages for the week with filters `from:<@U022N4RTD40> after:<Sunday before the week> before:<Saturday after the week>` (dates below), `sort: "timestamp"`, `response_format: "concise"`, `include_context: false`. Each call returns at most 20 messages plus a `cursor` when more exist. Keep calling with that cursor until no cursor comes back, up to 25 pages. Do not stop early because you think you have enough. Slack is a required source; if it fails, say so in notes.

Write exactly 3 callouts, one per project or workstream. Rank candidates in this order and pick the top 3:
- Production fixes and anything that unbroke real users
- Shipped or customer-visible work
- Unblocking someone who was stuck
- Bugs and wrong assumptions caught before they shipped
- Reusable leverage for the team
- Early shaping worth surfacing

Each callout has a short bold theme (the project or headline, 2-5 words) and one sentence of at most 25 words. No semicolons, no second sentence, no "including" lists. When crediting someone, end the sentence with "w/ @Name" and no period after it. Use past-tense shipping verbs: Shipped, Fixed, Wrapped, Reduced, Debugged, Completed, Unjammed, Derisked. Show reach and who the work helps, backed by real numbers, because Nathan is building a case for a raise and promotion and the callouts should not undersell him. Use a number only when a source states it (for example, a backfill cut from 49 hours to 3h16m, or 14 crash reports closed). Never count PRs, reviews, or merges, and never label every merged PR a crash fix.

Leave out: PR reviews, 1:1s, retros, and other ceremonies unless something specific came out of them; Apollos Code Reviewer; church demo pages; Chat v2 and Vitor topics; Linear issue numbers, PR numbers, ticket keys (APO-, SUP-, etc.); engineering jargon. Say "crash reports", not Sentry. Adult recap in plain English that a coworker would understand. Emoji only if he would have used one.

If he was out of office or it was a short week, and a source shows it as a fact, the last callout can be that note (for example theme "Short week", text "Out Monday through Wednesday, back Thursday").

People:
- Credit teammates as "w/ @FirstName" at the end of the callout, only when a source shows they worked on it with him. Never @ someone just for being in a meeting or thread. Nathan never gets an @.
- Use the taggable roster below. If a first name is listed as ambiguous, write the full name (for example "@Heather Peters") or drop the @.
- Names on the plain list are written without an @. Heather Fowler works on Unified Giving History and is not in Basecamp: write "Heather". Fowler and Michael are written without an @.
- When sources disagree on who someone is, drop the name instead of guessing.
- Do not credit Nathan with someone else's work.

Do not invent. Do not inflate a partial role.

Output: reply with ONLY a JSON object, no prose and no code fences:
{"callouts": [{"theme": string, "text": string}], "notes": string}
- theme: the bold theme without asterisks or a trailing colon.
- text: the sentence after the colon.
- notes: one short sentence only if a source failed or was missing, a day's daily is not posted, or a callout needs Nathan's check. Otherwise "".
