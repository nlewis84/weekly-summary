# Plan: Daily Snapshot Capture & Weekly Summary Integration

**Status: Draft** · **Priority: P0**

## Problem

Building the weekly summary requires either remembering what happened each day or manually pasting notes into the check-ins textarea. There is no way to save a daily record of metrics and details for later use.

## Changes

### Snapshot persistence layer (`lib/daily-snapshot.ts`)

- `saveDailySnapshot(date, payload)` — writes `daily-snapshots/YYYY-MM-DD.json` to the repo root
- `listDailySnapshots(weekEnding)` — returns available snapshots for the 7-day window
- `loadDailySnapshot(date)` — reads and parses a snapshot file
- `formatSnapshotAsCheckIn(date, payload)` — converts a snapshot into day-labeled check-in text
- `daily-snapshots/` added to `.gitignore`

### API routes

- `POST /api/snapshot` — captures today's (or yesterday's) metrics and saves to a JSON file
- `GET /api/snapshots` — lists available snapshots for the current week

### "Capture Today" button (`app/components/TodaySection.tsx`)

- Button next to the refresh button, uses `useFetcher` to POST to `/api/snapshot`
- Toast on success; changes to "Capture Yesterday" when viewing yesterday
- Disables if already captured

### Snapshot selector in Build Summary form (`app/components/FullSummaryForm.tsx`)

- Fetches available snapshots on mount/expand
- Day-of-week chips showing which days have captures
- Captured days checked by default, user can uncheck
- Existing textarea preserved for free-text entry
- On submit: formats selected snapshots as check-in text, concatenates with user text

### Container changes (`app/components/FullSummaryFormContainer.tsx`)

- Fetches snapshot list, threads data down to `FullSummaryForm`

## Files changed

| File | Change |
|------|--------|
| `lib/daily-snapshot.ts` | **New** — save, list, load, format snapshot functions |
| `app/routes/api.snapshot.ts` | **New** — POST to capture daily snapshot |
| `app/routes/api.snapshots.ts` | **New** — GET to list available snapshots for the week |
| `app/components/TodaySection.tsx` | Add "Capture Today/Yesterday" button |
| `app/components/FullSummaryForm.tsx` | Add snapshot day selector UI, merge snapshot data into check-ins |
| `app/components/FullSummaryFormContainer.tsx` | Fetch snapshot list, pass to form |
| `.gitignore` | Add `daily-snapshots/` |
