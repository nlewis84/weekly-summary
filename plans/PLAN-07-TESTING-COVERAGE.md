# Plan 07: Testing & Error Handling

**Status: 🔲 Pending**

## Problem

Expand test coverage and improve error handling across the app.

## Current State

- `lib/summary.test.ts` – 8 tests for summary logic
- No route/loader tests
- No component tests
- Error states exist but could be more consistent

## Tasks

1. [ ] Add loader tests for `_index`, `history`, `history.$week`, `charts` (mock GitHub API)
2. [ ] Add tests for `listWeeklySummaries`, `fetchWeeklySummary`, `getChartsData`
3. [ ] Standardize error UI (ErrorBanner usage, consistent messaging)
4. [ ] Add retry/refresh on error where appropriate (e.g. History page)
5. [ ] Consider E2E test for critical path: load → refresh → build summary

## Success Criteria

- Loaders and data-fetching logic have unit tests
- Error states are consistent and actionable
- CI runs tests on PR
