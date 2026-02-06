# Plan 56: Remove Slack Functionality

**Status: ✅ Complete**

**Validated Feb 2026:** Slack still present: `lib/slack.ts`, `app/routes/api.slack.ts`, Post to Slack buttons in FullSummaryForm and history.$week. Still relevant.

Remove all Slack integration from the weekly-summary app. The Slack feature (Plan 28) is complete but will be deprecated and removed.

## Scope

### 1. Delete Files

| File | Purpose |
|------|---------|
| `lib/slack.ts` | Core Slack webhook posting logic |
| `app/routes/api.slack.ts` | API route handler for POST `/api/slack` |

### 2. Remove UI Components

| File | Changes |
|------|---------|
| `app/components/FullSummaryForm.tsx` | Remove "Post to Slack" button, `slackPosting` state, and the `PaperPlaneTilt` icon import (if only used for Slack) |
| `app/routes/history.$week.tsx` | Remove "Post to Slack" button, `handlePostToSlack`, `slackPosting` state, and `PaperPlaneTilt` from imports |

### 3. Configuration & Environment

| File | Changes |
|------|---------|
| `.env.example` | Remove `SLACK_WEBHOOK_URL` and its comment block |

### 4. Documentation & Plans

| File | Changes |
|------|---------|
| `plans/README.md` | Remove Slack from P4 examples, plan index (28), and "Recommended Next" section |
| `plans/PLAN-28-SLACK-INTEGRATION.md` | Mark as deprecated/removed or delete |
| `plans/PLAN-05-PRODUCTIVITY-FEATURES.md` | Update "Slack/Teams post" reference if still relevant |

### 5. Content Files (Optional)

| File | Notes |
|------|-------|
| `2026-weekly-work-summaries/2026-01-09-week-in-review.md` | Contains "Slack" in transcript content—leave as-is (user content, not app code) |

## Implementation Order

1. **Remove UI** – Remove Slack buttons and handlers from `FullSummaryForm.tsx` and `history.$week.tsx` so users no longer see the feature.
2. **Delete API route** – Remove `app/routes/api.slack.ts`.
3. **Delete lib** – Remove `lib/slack.ts`.
4. **Update env** – Remove Slack vars from `.env.example`.
5. **Update plans** – Update `plans/README.md`, deprecate/remove `PLAN-28-SLACK-INTEGRATION.md`, and fix references in `PLAN-05`.

## Verification

- [ ] No "Post to Slack" buttons visible in the app
- [ ] No references to `/api/slack` in codebase
- [ ] No references to `postToSlack` or `lib/slack`
- [ ] `SLACK_WEBHOOK_URL` removed from `.env.example`
- [ ] E2E tests pass (none currently test Slack)
- [ ] Build succeeds

## Notes

- **PaperPlaneTilt**: Used only for Slack buttons; remove from both component imports.
- **Copy / Export PDF**: Keep these; they are separate features.
- **Plan 28**: Consider moving to an "Archived" or "Removed" section in the plans index rather than deleting, to preserve history.
