# Plan 41: Scheduled Summary Generation

**Status: 🔲 Pending** · **Priority: P4** · **Effort: High** · **Impact: High**

## Problem

Users must manually run "Generate & Save" each week. A scheduled job (e.g. Friday 5pm) could auto-generate and commit the summary, reducing forgetfulness.

## Tasks

1. [ ] Add cron/scheduler (Heroku Scheduler, GitHub Actions, or external cron) to call build endpoint
2. [ ] Create `POST /api/scheduled-build` (or similar) protected by secret token; runs weekly summary + persist
3. [ ] Optional: configurable day/time via env (e.g. `SUMMARY_CRON_DAY=5` for Friday)
4. [ ] Log success/failure; optional Slack notification on completion
5. [ ] Document setup in README (Heroku Scheduler, GitHub Actions workflow)

## Success Criteria

- Summary auto-generates on schedule without user action
- Fits common hosting (Heroku, Vercel cron, GitHub Actions)
- Secure (token-protected endpoint)
