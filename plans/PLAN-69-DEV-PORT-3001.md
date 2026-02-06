# Plan 69: Run Dev Server on Port 3001 Locally

**Status:** ✅ Complete · **Priority: P3** · **Effort: Trivial** · **Impact: Low**

**Created Feb 2026:** Configure the weekly-summary app to run on port 3001 in local development instead of the default 3000. Useful when 3000 is already in use or when running multiple apps side-by-side.

## Problem

The dev server (`pnpm dev`) and E2E tests are hardcoded to port 3000. There is no way to run on a different port without editing config files.

## Affected Files

| File | Role |
|------|------|
| `vite.config.ts` | Vite dev server port (currently 3000) |
| `playwright.config.ts` | E2E baseURL and webServer.url (localhost:3000) |
| `README.md` | Documentation of dev URL |

## Solution Approach

### 1. Update Vite Config

Change `server.port` in `vite.config.ts` from 3000 to 3001:

```ts
server: {
  port: 3001,
},
```

### 2. Update Playwright Config

Update `playwright.config.ts` so E2E tests target port 3001:

- `use.baseURL`: `http://localhost:3001`
- `webServer.url`: `http://localhost:3001`

### 3. Update README

Update the dev command documentation in `README.md` to show the correct URL:

```
pnpm dev    # http://localhost:3001
```

## Tasks

1. [x] Update `vite.config.ts` – set `server.port` to 3001
2. [x] Update `playwright.config.ts` – set baseURL and webServer.url to localhost:3001
3. [x] Update `README.md` – document dev URL as localhost:3001
4. [x] Verify `pnpm dev` starts on port 3001
5. [x] Verify `pnpm test:e2e` passes (starts dev server on 3001, runs tests)

## Success Criteria

- `pnpm dev` serves the app at http://localhost:3001
- E2E tests run against localhost:3001 and pass
- README reflects the correct local URL

## Notes

- **Production deploy:** The Procfile uses `pnpm start` (react-router-serve). Production port is typically set by the deployment platform (e.g., `PORT` env var on Heroku/Railway). No changes needed for production.
- **Optional:** Use `process.env.PORT` or `process.env.DEV_PORT` in vite.config.ts if you want configurable port via env vars (e.g., `DEV_PORT=3001 pnpm dev`). This plan keeps it simple with a fixed 3001.
