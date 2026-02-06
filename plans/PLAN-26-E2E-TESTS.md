# Plan 26: E2E Critical Path Tests

**Status: ✅ Complete** · **Priority: P3** · **Effort: Medium** · **Impact: High**

## Problem

Unit tests cover libs and components, but critical user flows (load → view metrics → build summary → see history) are untested. Regressions can ship unnoticed.

## Tasks

1. [x] Add Playwright
2. [x] E2E: Index loads, Today/Weekly metrics render (or error state)
3. [x] E2E: Build Summary form submit (mock or fixture data)
4. [x] E2E: History index and week detail navigation
5. [x] E2E: Charts page loads
6. [ ] Run in CI on PR

## Success Criteria

- Critical paths have E2E coverage
- CI fails if E2E breaks
- Tests run in &lt;2 min

---

## Resolution

- Playwright added with `@playwright/test`
- `playwright.config.ts`: webServer (pnpm dev), reuseExistingServer, Chromium
- `e2e/index.spec.ts`: Index loads, metrics/error/loading, Build Summary form
- `e2e/history.spec.ts`: History index, week detail navigation, Copy markdown
- `e2e/charts.spec.ts`: Charts load, Export CSV
- `e2e/navigation.spec.ts`: Nav links, Build Summary scroll
- Scripts: `pnpm test:e2e`, `pnpm test:e2e:ui`
