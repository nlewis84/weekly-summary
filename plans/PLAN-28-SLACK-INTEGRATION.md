# Plan 28: Slack Integration

**Status: 🗑️ Removed** · **Priority: P4** · **Effort: High** · **Impact: High**

> **Deprecated Feb 2026:** Slack integration was removed per [Plan 56](PLAN-56-REMOVE-SLACK.md).

## Problem

Summaries are built for standups, reviews, and team updates. Posting directly to Slack would reduce copy-paste and increase sharing.

## Tasks

1. [ ] Add "Post to Slack" button on week detail and after build
2. [ ] OAuth or Slack app setup: user connects workspace (store token server-side)
3. [ ] API: post message to channel (user selects channel or uses default)
4. [ ] Format summary for Slack (markdown, blocks, or plain)
5. [ ] Handle token refresh and revocation

## Success Criteria

- User can post a summary to a Slack channel with one click
- Token is stored securely; no secrets in client
