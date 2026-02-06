#!/bin/bash
# Fetch PR comment counts for weeks ending Jan 2, 9, 16, 23
# Usage: GITHUB_TOKEN=xxx ./scripts/fetch-pr-comments.sh
#        GITHUB_TOKEN=xxx GITHUB_USERNAME=nlewis84 ./scripts/fetch-pr-comments.sh

set -e
TOKEN="${GITHUB_TOKEN:?Set GITHUB_TOKEN}"
USER="${GITHUB_USERNAME:-nlewis84}"

# Week windows (UTC): window_start -> window_end (matches meta in JSON files)
# 2026-01-02: 2025-12-27T06:00:00Z -> 2026-01-02T23:59:59Z
# 2026-01-09: 2026-01-03T06:00:00Z -> 2026-01-09T23:59:59Z
# 2026-01-16: 2026-01-10T06:00:00Z -> 2026-01-16T23:59:59Z
# 2026-01-23: 2026-01-17T06:00:00Z -> 2026-01-23T23:59:59Z

TMP=$(mktemp)
for page in 1 2 3 4 5 6 7 8; do
  curl -s -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    "https://api.github.com/users/$USER/events?per_page=100&page=$page" | \
    jq -r '.[] | select(.type == "IssueCommentEvent" and .payload.issue.pull_request != null and (.repo.name | startswith("ApollosProject/"))) | .created_at' >> "$TMP"
done

echo "PR comments by week (ApollosProject repos only):"
echo ""

# Use simple string comparison (ISO8601 sorts correctly)
# Windows: start inclusive, end exclusive (< next day) to avoid boundary issues
count_w1=$(awk '$0 >= "2025-12-27T06:00:00" && $0 < "2026-01-03T00:00:00"' "$TMP" | wc -l | tr -d ' ')
count_w2=$(awk '$0 >= "2026-01-03T06:00:00" && $0 < "2026-01-10T00:00:00"' "$TMP" | wc -l | tr -d ' ')
count_w3=$(awk '$0 >= "2026-01-10T06:00:00" && $0 < "2026-01-17T00:00:00"' "$TMP" | wc -l | tr -d ' ')
count_w4=$(awk '$0 >= "2026-01-17T06:00:00" && $0 < "2026-01-24T00:00:00"' "$TMP" | wc -l | tr -d ' ')

echo "Week ending 2026-01-02: $count_w1"
echo "Week ending 2026-01-09: $count_w2"
echo "Week ending 2026-01-16: $count_w3"
echo "Week ending 2026-01-23: $count_w4"

rm -f "$TMP"
