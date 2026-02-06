# Plan 03: Fix History / Weekly Summary Links

**Status: ✅ Complete**

## Problem

Clicking weekly summaries doesn’t do anything. Links on the History page should navigate to the week detail view but may be broken.

## Current State

- `app/routes/history.tsx` – Lists weeks, each with `<Link to={\`/history/${week}\`}>`
- `app/routes/history.$week.tsx` – Detail view for a single week (params.week)
- Route structure: `history` (index) and `history.$week` (dynamic)

## Investigation Needed

1. [ ] Confirm route naming: `history.$week` → `/history/:week` (e.g. `/history/2026-01-31`)
2. [ ] Check if `week` from `listWeeklySummaries()` matches route param format
3. [ ] Verify `Link` components render and have correct `to` prop
4. [ ] Check for client-side JS errors blocking navigation
5. [ ] Ensure `history.$week` loader receives `params.week` correctly

## Possible Causes

- Route param mismatch (e.g. `history.week` vs `history.$week`)
- `week` value format (e.g. `2026-01-31` vs `20260131`)
- Link `to` malformed
- Missing route definition

## Tasks

1. [ ] Trace click → navigation flow
2. [ ] Fix any route or Link issues
3. [ ] Add basic E2E or manual test for "click week → see detail"
4. [ ] Consider: make WeeklySection on index page link to current week’s detail (if applicable)

## Success Criteria

- Clicking a week on History navigates to `/history/{week}`
- Week detail page shows MetricsCard and summary data
- Back link returns to History list

---

## Resolution

**Root cause:** `history.$week.tsx` is a child route of `history.tsx`. The parent had no `<Outlet />`, so the child never rendered when navigating to `/history/:week`.

**Fix:** Split into proper nested layout:
- `history.tsx` – Layout with `<Outlet />`
- `history._index.tsx` – List of weeks (at `/history`)
- `history.$week.tsx` – Week detail (at `/history/:week`)
