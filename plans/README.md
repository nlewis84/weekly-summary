# Weekly Summary – Improvement Plans

Plans for improving the weekly-summary app. Each plan is a standalone document. Mark `**Status: ✅ Complete**` at the top when done.

## Priority Framework

| Tier | Focus | Example plans |
|------|-------|---------------|
| **P0** | Friction reduction, activation | Toast, Check-in templates, Last built |
| **P1** | Data value, engagement | Trend badges, Compare weeks, Search |
| **P2** | Export & polish | Style guide, PDF, Bulk export |
| **P3** | Platform & scale | Observability, E2E, Chunk size |
| **P4** | Growth & integrations | Slack, Annual dashboard |

## Plan Index

| Plan | Title | Priority | Status |
|------|-------|----------|--------|
| [01](PLAN-01-CHARTS.md) | Charts Overhaul | — | ✅ Complete |
| [02](PLAN-02-HISTORY-SCOPE.md) | History Scope (Earlier Summaries) | — | ✅ Complete |
| [03](PLAN-03-HISTORY-LINKS.md) | Fix History / Weekly Summary Links | — | ✅ Complete |
| [04](PLAN-04-BUILD-SUMMARY-UX.md) | Build Weekly Summary UX | — | ✅ Complete |
| [05](PLAN-05-PRODUCTIVITY-FEATURES.md) | Productivity Features | — | ✅ Complete |
| [06](PLAN-06-ROOT-LAYOUT.md) | Root Layout & Navigation | — | ✅ Complete |
| [07](PLAN-07-TESTING-COVERAGE.md) | Testing & Error Handling | — | ✅ Complete |
| [08](PLAN-08-PERFORMANCE.md) | Performance & Loading States | — | ✅ Complete |
| [09](PLAN-09-MOBILE-RESPONSIVE.md) | Mobile Responsive | — | ✅ Complete |
| [10](PLAN-10-ERROR-BOUNDARIES.md) | Error Boundaries | — | ✅ Complete |
| [11](PLAN-11-SECURITY.md) | Security & Secrets | — | ✅ Complete |
| [12](PLAN-12-OFFLINE-PWA.md) | Offline / PWA | — | ✅ Complete |
| [13](PLAN-13-ACCESSIBILITY.md) | Accessibility | — | ✅ Complete |
| [14](PLAN-14-DARK-MODE.md) | Dark Mode Toggle | — | ✅ Complete |
| [15](PLAN-15-EXPORT-PDF.md) | Export to PDF | P2 | ✅ Complete |
| [16](PLAN-16-SETTINGS-PAGE.md) | Settings Page | P2 | ✅ Complete |
| [17](PLAN-17-TREND-BADGES.md) | Trend Badges on Metrics | P1 | ✅ Complete |
| [18](PLAN-18-CHECK-IN-TEMPLATES.md) | Check-in Templates | P0 | ✅ Complete |
| [19](PLAN-19-SEARCH-HISTORY.md) | Search Across History | P1 | ✅ Complete |
| [20](PLAN-20-KEYBOARD-SHORTCUTS-HELP.md) | Keyboard Shortcuts Help | P0 | ✅ Complete |
| [21](PLAN-21-LAST-BUILT-TIMESTAMP.md) | Last Built Timestamp | P0 | ✅ Complete |
| [22](PLAN-22-BULK-EXPORT.md) | Bulk Export | P2 | ✅ Complete |
| [23](PLAN-23-COMPARE-WEEKS.md) | Compare Weeks | P1 | ✅ Complete |
| [24](PLAN-24-TOAST-NOTIFICATIONS.md) | Toast Notifications | P0 | ✅ Complete |
| [25](PLAN-25-OBSERVABILITY.md) | Observability & Error Tracking | P3 | ✅ Complete |
| [26](PLAN-26-E2E-TESTS.md) | E2E Critical Path Tests | P3 | ✅ Complete |
| [27](PLAN-27-CHUNK-SIZE-REDUCTION.md) | Charts Chunk Size Reduction | P3 | ✅ Complete |
| [28](PLAN-28-SLACK-INTEGRATION.md) | Slack Integration | P4 | ✅ Complete |
| [29](PLAN-29-ANNUAL-DASHBOARD.md) | Annual Dashboard | P4 | ✅ Complete |
| [30](PLAN-30-API-QUOTA-VISIBILITY.md) | API Quota Visibility | P3 | ✅ Complete |
| [31](PLAN-31-STYLE-GUIDE-ADHERENCE.md) | Style Guide Adherence | P2 | ✅ Complete |
| [32](PLAN-32-TRANSCRIPT-TO-JSON.md) | Parse Transcripts → JSON + MD | — | ✅ Complete |
| [33](PLAN-33-METRICS-CARD-REVAMP.md) | Metrics Card Revamp | P2 | ✅ Complete |
| [34](PLAN-34-CONFIGURABLE-REFRESH.md) | Configurable Refresh Interval | P0 | ✅ Complete |
| [35](PLAN-35-HEALTH-CHECK-ENHANCEMENTS.md) | Health Check Enhancements | P3 | ✅ Complete |
| [36](PLAN-36-YESTERDAY-SUMMARY.md) | Yesterday Summary | P1 | ✅ Complete |
| [37](PLAN-37-WEEKLY-GOALS.md) | Weekly Goals / Targets | P1 | ✅ Complete |
| [39](PLAN-39-HISTORY-FILTERS.md) | History Filters (by Repo / Project) | P2 | 🔲 Pending |
| [41](PLAN-41-SCHEDULED-SUMMARY.md) | Scheduled Summary Generation | P4 | 🔲 Pending |
| [42](PLAN-42-PR-COMMENTS-METRIC.md) | PR Comments Metric | P2 | ✅ Complete |
| [43](PLAN-43-DARK-MODE-PREFER.md) | Respect System Dark Mode on First Visit | P2 | ✅ Complete |
| [44](PLAN-44-COMPARE-ANNUAL.md) | Compare Years (Annual) | P2 | ✅ Complete |
| [45](PLAN-45-COMMITS-METRIC.md) | Commits Pushed (GitHub) | P2 | ✅ Complete |
| [46](PLAN-46-LINEAR-COMMENTS-METRIC.md) | Linear Issue Comments | P2 | 🔲 Pending |
| [47](PLAN-47-GITHUB-ISSUES-METRIC.md) | GitHub Issues Opened/Closed | P2 | 🔲 Pending |
| [48](PLAN-48-PR-REVIEW-COMMENTS-METRIC.md) | PR Review Comments (Code Review) | P2 | 🔲 Pending |
| [49](PLAN-49-LINEAR-ISSUES-CREATED-METRIC.md) | Linear Issues Created | P2 | 🔲 Pending |
| [50](PLAN-50-CHART-LIBRARY-REPLACEMENT.md) | Chart Library Replacement (Beautiful Charts) | P2 | ✅ Complete |

## Recommended Next (by priority)

**P0 – Ship first (friction reduction):** 24 Toast → 18 Check-in templates → 21 Last built → 20 Keyboard shortcuts help

**P1 – Data value:** 17 Trend badges → 19 Search → 23 Compare weeks

**P2 – Export & polish:** 31 Style guide → 15 PDF → 16 Settings → 22 Bulk export

**P3 – Platform:** 25 Observability → 30 API quota → 26 E2E → 27 Chunk size

**P4 – Growth:** 28 Slack → 29 Annual dashboard

**New (34–50):** 34 Configurable refresh → 36 Yesterday → 37 Weekly goals → 42 PR comments → 50 Chart library replacement → 45–49 metrics → 39 History filters → 43 Dark mode → 44 Compare annual → 35 Health check → 41 Scheduled summary
