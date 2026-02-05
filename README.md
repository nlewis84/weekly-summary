# Weekly Summary

Generates weekly work summaries from Linear issues, GitHub activity, and optional check-ins. Standalone project (extracted from Apollos).

## Features

- **CLI**: Run from terminal with check-ins file, stdin, or interactive input
- **Web GUI**: React Router 7 app with form and metrics display
- **6 metrics**: PRs merged, PRs created/updated, PR reviews, Linear completed, Linear worked on, repos
- **Today mode**: `--today` / `-t` for midnight-to-now window

## Setup

1. Copy `.env.example` to `.env`
2. Set `LINEAR_API_KEY` and `GITHUB_TOKEN` in `.env` (optional: `GITHUB_USERNAME`, defaults to `nlewis84`)
3. The app loads variables from `.env` automatically (CLI and web server)

## Usage

### CLI

```bash
# Today only (since midnight)
pnpm cli --today

# With check-ins file
pnpm cli check-ins.txt

# Interactive (type check-ins, Ctrl+D when done)
pnpm cli
```

### Web

```bash
pnpm dev    # http://localhost:3000
pnpm build && pnpm start
```

## Scripts

| Command      | Description                    |
| ------------ | ------------------------------ |
| `pnpm dev`   | Start dev server              |
| `pnpm build` | Build for production          |
| `pnpm start` | Serve production build        |
| `pnpm cli`   | Run CLI (supports `--today`)   |
| `pnpm test`  | Run tests                     |
| `pnpm lint`  | Run ESLint                    |
| `pnpm typecheck` | TypeScript check          |

## Deployment (Heroku)

1. Create app: `heroku create weekly-summary`
2. Set config: `heroku config:set LINEAR_API_KEY=... GITHUB_TOKEN=...`
3. Deploy: `git push heroku main`

Procfile runs `react-router-serve build/server/index.js`.
