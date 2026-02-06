# Plan 25: Observability & Error Tracking

**Status: ✅ Complete** · **Priority: P3** · **Effort: Medium** · **Impact: High**

## Problem

When loaders fail, API rate limits hit, or users hit errors, we have no visibility. We need to know when things break and why, without users having to report.

## Tasks

1. [ ] Add error boundary reporting (capture React errors to backend or 3rd party)
2. [ ] Log loader/action failures with context (route, error type, stack)
3. [ ] Optional: integrate Sentry, LogRocket, or self-hosted (e.g. GlitchTip)
4. [ ] Track API failures (GitHub 403/429, Linear errors) with retry counts
5. [ ] Health check endpoint for monitoring (e.g. `/health`)

## Success Criteria

- Critical errors are captured and attributable
- Team can diagnose failures without repro
- Health endpoint returns 200 when app is healthy
