# Plan 10: Error Boundaries

**Status: ✅ Complete**

## Problem

Uncaught errors in components can crash the whole app. Add error boundaries for graceful degradation.

## Tasks

1. [ ] Add route-level ErrorBoundary to root or key routes
2. [ ] Show friendly error UI with retry option
3. [ ] Log errors (e.g. to console or error service)
4. [ ] Consider: error boundary for charts (heavy dependency)

## Success Criteria

- One route failing doesn't blank the whole app
- User can retry or navigate away

---

## Resolution

- Root ErrorBoundary in app/root.tsx: handles isRouteErrorResponse, Error, unknown; Retry + Go home; logs to console
- Charts ErrorBoundary in app/routes/charts.tsx: localized fallback for Tremor/charts failures
