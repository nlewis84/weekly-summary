# Weekly Summary

Generates weekly work summaries from Linear issues, GitHub activity, and optional check-ins. Standalone project (extracted from Apollos).

## Features

- **CLI**: Run from terminal with check-ins file, stdin, or interactive input
- **Web GUI**: React Router 7 app with form and metrics display
- **6 metrics**: PRs merged, PRs created/updated, PR reviews, Linear completed, Linear worked on, repos
- **Today mode**: `--today` / `-t` for midnight-to-now window
- **Yesterday mode**: `--yesterday` / `-y` for yesterday's stats

## Setup

1. Copy `.env.example` to `.env`
2. Set `LINEAR_API_KEY` and `GITHUB_TOKEN` in `.env` (optional: `GITHUB_USERNAME`, defaults to `nlewis84`)
3. Optional: `GITHUB_SUMMARY_PATHS` – comma-separated paths for summaries (default: `2026-weekly-work-summaries`). Add `2025-weekly-work-summaries` etc. for earlier years.
3. The app loads variables from `.env` automatically (CLI and web server)

GitHub API calls retry automatically on 403/429 (rate limit) to stay within GitHub ToS.

## Usage

### CLI

```bash
# Today only (since midnight)
pnpm cli --today

# Yesterday only
pnpm cli --yesterday

# With check-ins file
pnpm cli check-ins.txt

# Interactive (type check-ins, Ctrl+D when done)
pnpm cli
```

### Web

```bash
pnpm dev    # http://localhost:3001
pnpm build && pnpm start
```

## Scripts

| Command      | Description                    |
| ------------ | ------------------------------ |
| `pnpm dev`   | Start dev server              |
| `pnpm build` | Build for production          |
| `pnpm start` | Serve production build        |
| `pnpm cli`   | Run CLI (supports `--today`, `--yesterday`) |
| `pnpm test`  | Run unit tests                |
| `pnpm test:e2e` | Run Playwright E2E tests  |
| `pnpm lint`  | Run ESLint                    |
| `pnpm typecheck` | TypeScript check          |

## Deployment (Heroku)

1. Create app: `heroku create weekly-summary`
2. Set config: `heroku config:set LINEAR_API_KEY=... GITHUB_TOKEN=...`
3. Deploy: `git push heroku main`

Procfile runs `react-router-serve build/server/index.js`.

## Monitoring

- **Lightweight**: `GET /health` returns `{ ok: true, timestamp }` (no external calls).
- **Deep check**: `GET /health?deep=true` verifies GitHub and Linear API connectivity. Returns `{ ok, timestamp, github, linear }` with `"ok"` or `"error"` per service. Use for alerting when APIs are down (e.g. Uptime Robot, Heroku).

## Security

- **Secrets**: `LINEAR_API_KEY`, `GITHUB_TOKEN`, and other env vars are used only in server-side loaders and API routes. They are never sent to the client bundle.
- **`.env`**: Never commit `.env`. It is listed in `.gitignore`. Use `.env.example` as a template.
- **Deployment**: Set config vars via your host (e.g. `heroku config:set`) rather than committing secrets.
