# Plan 02: History Scope (Earlier Summaries)

**Status: 🔲 Pending**

## Problem

History only goes back to ~Jan 30. Earlier weekly summaries exist (e.g. 2025, or earlier 2026 weeks) but aren’t shown.

## Current State

- `lib/github-fetch.ts` – `BASE_PATH = "2026-weekly-work-summaries"` (hardcoded)
- `listWeeklySummaries()` – Lists JSON files in that single folder only
- `fetchWeeklySummary(week)` – Fetches from `{BASE_PATH}/{week}.json`

## Root Cause

Single hardcoded path. Summaries in other folders (e.g. `2025-weekly-work-summaries`, `weekly-work-summaries`, or different repo structure) are ignored.

## Tasks

1. [ ] Support multiple base paths (e.g. `GITHUB_SUMMARY_PATHS` or scan repo for `*-weekly-work-summaries`)
2. [ ] Or: configurable path pattern in `.env` (e.g. `GITHUB_SUMMARY_PATH=2026-weekly-work-summaries,2025-weekly-work-summaries`)
3. [ ] Update `listWeeklySummaries()` to aggregate from all configured paths
4. [ ] Update `fetchWeeklySummary()` to search across paths (or derive path from week format)
5. [ ] Update `getChartsData()` in `lib/charts-data.ts` to use expanded history
6. [ ] Document env vars in README

## Success Criteria

- All existing summaries (across years/folders) appear in History
- Charts include full history
- No breaking changes for current single-path setup
