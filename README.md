# :bar_chart: Weekly Summary

Welcome to Weekly Summary! This app turns your Linear issues and GitHub activity into daily and weekly work metrics you can read in the browser or from the terminal. It is built for engineers who want a single place to track PRs, reviews, Linear throughput, check-ins, and progress toward a monthly merge goal. Standalone project (extracted from Apollos).

- Node.js >=22
- React Router 7.13 / React 19.2 / TypeScript 5.9
- Vite 7.3 / Tailwind CSS 4.1
- Vitest / Playwright

## :chart_with_upwards_trend: Features

- **CLI and web dashboard:** Run summaries from the terminal or use the React Router 7 UI with live metrics, charts, and history.
- **GitHub and Linear stats:** PRs merged and active, reviews, comments, commits pushed, Linear completed and worked on, issues created, repos touched, plus code-volume and review-latency detail when data is available.
- **Monthly PR target:** Month-to-date merged PRs against a goal you set in Settings (default 28), with pace, projection, and a burn-up chart on the home page.
- **Flexible windows:** `--today` / `-t` for since midnight, `--yesterday` / `-y` for yesterday, or `--week` / `-w YYYY-MM-DD` for a past Friday week-ending (uses `daily-snapshots/` check-ins when present).
- **Weekly build flow:** Paste or capture check-ins, generate JSON and Markdown under your configured summary paths, and optionally post to Basecamp or pull in Granola meeting notes when those integrations are configured.
- **Ops-friendly:** `GET /health` for a lightweight probe and `GET /health?deep=true` to check GitHub and Linear connectivity (for Uptime Robot, Heroku, and similar).

## :open_file_folder: Installation

- Download or clone this project.
- Copy `.env.example` to `.env`.
- Add a [Linear API key](https://linear.app/settings/api) as `LINEAR_API_KEY` and a GitHub token as `GITHUB_TOKEN` (optional: `GITHUB_USERNAME`, default `nlewis84`; optional: `GITHUB_SUMMARY_PATHS` for summary folders such as `2026-weekly-work-summaries` or earlier years).
- Optional integrations: Granola (`GRANOLA_API_KEY`), Basecamp (project and check-in IDs plus the [Basecamp CLI](https://basecamp.com/agents#cli)), and commit-tracking repos via `GITHUB_ORG` / `GITHUB_COMMIT_REPOS` (see `.env.example`).

The app loads `.env` automatically for both the CLI and the web server. Never commit `.env`; set production secrets with your host (for example `heroku config:set`).

## :calendar: Usage

- `cd` into the project directory.
- Run `pnpm install`.
- Run `pnpm dev` and open your browser at [http://localhost:3001](http://localhost:3001).
- For a production build locally, run `pnpm build` then `pnpm start`.

**CLI**

- Run `pnpm cli --today` for stats since midnight today.
- Run `pnpm cli --yesterday` for yesterday's window.
- Run `pnpm cli --week 2026-07-03` to backfill a week (Friday week-ending date).
- Run `pnpm cli check-ins.txt` to pass a check-ins file, or run `pnpm cli` and type check-ins (Ctrl+D when done).

**Deploy on Heroku**

- Run `heroku create weekly-summary` (or use your existing app).
- Run `heroku config:set LINEAR_API_KEY=... GITHUB_TOKEN=...`.
- Run `git push heroku main` (the Procfile runs `react-router-serve build/server/index.js` via `pnpm start`).

**Other scripts:** `pnpm test`, `pnpm test:e2e`, `pnpm lint`, and `pnpm typecheck` match the package scripts.

## :mag: How It Works

- GitHub API calls retry on 403/429 rate limits; parallel PR fetches respect `GITHUB_FETCH_CONCURRENCY` because GitHub enforces a short burst limit below the hourly quota `/rate_limit` reports.
- `pr_reviews` counts distinct PRs you reviewed in the window, not individual review submissions, so summing daily snapshots can overshoot the true weekly count when the same PR spans multiple days.
- Older weekly JSON files may undercount `pr_reviews` and `pr_comments`; repair with `pnpm backfill-pr-review-counts --dry-run` (preview), `pnpm backfill-pr-review-counts` (write), or `pnpm backfill-pr-review-counts 2026-09-04` (one week). The script refuses to lower a saved count and skips weeks past GitHub search's 1,000-result ceiling.
- API keys and tokens are used only in server loaders and API routes and are not exposed in the client bundle.

## :raised_hands: Acknowledgements

Weekly summary logic was originally built inside Apollos and later extracted into this repo (see `lib/summary.ts`).
