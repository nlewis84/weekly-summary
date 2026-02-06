# Plan 32: Parse Transcripts → JSON + MD

**Status: ✅ Complete**

## Goal

Parse `*-week-in-review.md` transcripts (2026-01-02 through 2026-01-23) and produce correct `.json` and `.md` files for each week. The 2026-01-30 transcript is **context only** for the existing 2026-01-31 output.

## Scope

| Transcript | Output | Notes |
|------------|--------|-------|
| `2026-01-02-week-in-review.md` | `2026-01-02.json`, `2026-01-02.md` | Two segments (Fri + another day); sign-in/sign-up, OTP, merge flow, give route |
| `2026-01-09-week-in-review.md` | `2026-01-09.json`, `2026-01-09.md` | Explicit stats (21 merged, 25 total, 16 reviews, 29/35 Linear); Web Giving |
| `2026-01-16-week-in-review.md` | `2026-01-16.json`, `2026-01-16.md` | Demo-heavy; no explicit stats; old vs new give flow |
| `2026-01-23-week-in-review.md` | `2026-01-23.json`, `2026-01-23.md` | Explicit stats (25 merged, 31 total, 21 reviews, 29/33 Linear); time-to-paint, Vercel |
| `2026-01-30-week-in-review.md` | — | **Context only** for 2026-01-31; do not produce separate output |

## Transcript Format

- **Header**: `# Week in review — YYYY-MM-DD (Day)`
- **Body**: Blocks of `timestamp text` (e.g. `0:00 Hey, how's it going...`)
- **Separator**: `---` between segments (some transcripts have multiple days)
- **Stats** (when present): e.g. "21 PRs merged", "25 total PRs", "16 PR reviews", "29 linear completed", "35 worked on"
- **Repos**: apollos-admin, apollos-cluster (inferred from narrative)

## Target Output Format

### JSON (Payload)

```ts
// lib/types.ts
interface Payload {
  meta: { generated_at, window_start, window_end, week_ending, source_of_truth? };
  stats: { prs_merged, prs_total, pr_reviews, pr_comments, linear_completed, linear_worked_on, repos };
  linear: { completed_issues, worked_on_issues };
  github: { merged_prs, reviews };
  check_ins: { day, content }[];
  terminal_output: string;
  formatted_output: string | null;
}
```

- **meta**: Derive `window_start`/`window_end` from `week_ending` (Sat–Fri window).
- **stats**: Extract from transcript when mentioned; otherwise use `0` or placeholder.
- **linear**: Extract issue identifiers (e.g. APO-XXXX) and titles when mentioned; otherwise empty arrays.
- **github**: Transcripts rarely list PR URLs; use empty arrays or inferred titles from narrative.
- **check_ins**: Transcripts don't have Slack-style check-ins; use `[]` or a single "Week in review" entry.
- **terminal_output** / **formatted_output**: Build from extracted accomplishments (AI or template).

### MD

Use `buildMarkdownSummary(payload)` from `lib/markdown.ts` to produce the `.md` file.

## Parsing Strategy

### Option A: AI-Assisted (Recommended)

1. **Prompt**: Provide transcript + Payload schema. Ask model to extract:
   - Stats (prs_merged, prs_total, pr_reviews, linear_completed, linear_worked_on, repos)
   - Accomplishments (Linear issues, PRs, themes)
   - Narrative summary for `formatted_output`
2. **Validation**: Ensure output conforms to Payload schema; fill missing fields with defaults.
3. **Tooling**: Cursor / AI session to process each transcript; or a script that calls an LLM API.

### Option B: Rule-Based

1. **Stats**: Regex for "X PRs merged", "Y total PRs", "Z reviews", "N linear completed", "M worked on".
2. **Linear**: Regex for `APO-\d+` and nearby title text.
3. **Repos**: Keyword search for "admin", "cluster".
4. **Limitation**: Transcripts are informal; many stats and issues are not explicitly stated.

### Option C: Hybrid

- Rule-based for explicit stats (01-09, 01-23).
- AI for narrative extraction and `formatted_output`.
- Manual review for weeks with sparse data (01-02, 01-16).

## Tooling

### 1. CLI Script: `pnpm cli:transcript`

```bash
pnpm cli:transcript [path-to-transcript.md]
# Or: pnpm cli:transcript 2026-weekly-work-summaries/2026-01-02-week-in-review.md
```

- Reads transcript
- Extracts `week_ending` from header
- Calls extraction logic (AI or rules)
- Writes `{week_ending}.json` and `{week_ending}.md` to `2026-weekly-work-summaries/`

### 2. Batch Script

```bash
pnpm cli:transcript --batch
# Processes 2026-01-02, 2026-01-09, 2026-01-16, 2026-01-23
# Skips 2026-01-30 (context only)
```

### 3. AI Workflow (Cursor)

- For each transcript: open file → run extraction prompt → paste output into JSON/MD.
- Or: use `scripts/transcript-to-payload.ts` that reads transcript and outputs a draft Payload for manual/AI refinement.

## Implementation Checklist

- [x] Add `scripts/transcript-to-payload.ts` (or `lib/transcript-parse.ts`)
  - [x] Parse header → `week_ending`
  - [x] Rule-based stats extraction (when present)
  - [x] Placeholder Payload with sensible defaults
- [x] Add `pnpm cli:transcript` script in package.json
- [x] Create extraction prompt (for AI-assisted path)
- [x] Process 2026-01-02, 2026-01-09, 2026-01-16, 2026-01-23
- [x] Validate output: `buildMarkdownSummary(payload)` produces valid .md
- [x] Ensure `fetchWeeklySummaryRaw` prefers `.json` over `-week-in-review.md` when both exist (or remove transcript after conversion)

## 2026-01-30 Handling

- **Do not** produce `2026-01-30.json` or `2026-01-30.md`.
- The 2026-01-30 transcript describes the week ending 2026-01-31.
- Use it as context when validating or refining `2026-01-31.json` / `2026-01-31.md` (which already exist and were built from API data).

## File Naming

- Transcripts: `YYYY-MM-DD-week-in-review.md`
- Output: `YYYY-MM-DD.json`, `YYYY-MM-DD.md`
- Week ending = date in transcript header (typically Friday)
