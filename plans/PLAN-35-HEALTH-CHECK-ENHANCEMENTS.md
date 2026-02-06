# Plan 35: Health Check Enhancements

**Status: ✅ Complete** · **Priority: P3** · **Effort: Low** · **Impact: Medium**

## Problem

`/health` returns `{ ok: true, timestamp }` but does not verify that GitHub or Linear APIs are reachable. For monitoring (e.g. Uptime Robot, Heroku), a deeper health check would help distinguish "app is up" from "app can fetch data."

## Tasks

1. [ ] Add optional `?deep=true` query param to `/health`
2. [ ] When `deep=true`: ping GitHub (e.g. `GET /rate_limit`) and Linear (e.g. `viewer` query); include `{ github: "ok"|"error", linear: "ok"|"error" }` in response
3. [ ] Keep default (no query) as lightweight: `{ ok: true, timestamp }` only
4. [ ] Document in README for monitoring setup

## Success Criteria

- Default `/health` remains fast (no external calls)
- `GET /health?deep=true` returns API connectivity status
- Useful for alerting when APIs are down
