# PLAN-59: Intent Prefetch on Links

**Status:** Done

## Overview

Add `prefetch="intent"` to all `Link` and `NavLink` components across the app. React Router 7 supports this natively—it prefetches route data and modules when the user hovers or focuses a link, making navigation feel instant.

## Background

React Router 7 (and Remix) expose a `prefetch` prop on `Link` and `NavLink`:

| Value | Behavior |
|-------|----------|
| `none` | Default—no prefetching |
| `intent` | Prefetches on hover/focus (recommended for most nav links) |
| `render` | Prefetches when link renders (aggressive; use sparingly) |
| `viewport` | Prefetches when link enters viewport (useful for mobile; [known bug in RR7.0.1](https://github.com/remix-run/react-router/issues/12439)) |

**Intent** is the sweet spot: it only fetches when the user shows interest, avoiding wasted bandwidth while still making clicks feel instant.

Prefetching uses `<link rel="prefetch">` tags. RR7 inserts them after the link element, so if you use `nav :last-child` you may need `nav :last-of-type` instead.

## Scope

### In scope

- All `Link` components that navigate to app routes
- All `NavLink` components in the header and elsewhere

### Out of scope

- **External links** (`MetricsCard.tsx`)—`<a href>` to GitHub, Linear, etc. These are not app routes; no prefetch.
- **Skip-to-content** (`<a href="#main-content">`)—anchor link, not a route.
- **Programmatic navigation**—`window.location.href` in ShortcutsHelp, download links (`a.href` for ZIP export)—not `Link`/`NavLink`.
- **Error boundary "Retry"**—uses `window.location.reload()`, not navigation.

## Inventory

| File | Component | Target | Count |
|------|-----------|--------|-------|
| `app/root.tsx` | Link | `/`, `/#build-summary` | 2 |
| `app/root.tsx` | Link | `/` (error boundary) | 1 |
| `app/root.tsx` | NavLink | `/history`, `/charts`, `/settings` | 3 |
| `app/routes/history._index.tsx` | Link | `/history/compare`, `/charts?view=annual`, `/history/:week` | 3 |
| `app/routes/history.$week.tsx` | Link | `/history` | 1 |
| `app/routes/history.compare.tsx` | Link | `/history` | 1 |
| `app/routes/charts.tsx` | Link | `/` (error boundary) | 1 |
| `app/routes/charts.tsx` | Link | `/` (back link) | 1 |
| `app/routes/settings.tsx` | Link | `/` | 1 |
| `app/components/AnnualChartsSection.tsx` | Link | `/history`, `/history/:week` | 2 |

**Total:** 16 `Link`/`NavLink` instances to update.

## Implementation

### Phase 1: Header and root links

1. **`app/root.tsx`**
   - Add `prefetch="intent"` to:
     - Logo `Link` (to `/`)
     - Build Summary `Link` (to `/#build-summary`)
     - All 3 `NavLink`s (History, Charts, Settings)
   - Error boundary: add `prefetch="intent"` to "Go home" `Link`

### Phase 2: History routes

2. **`app/routes/history._index.tsx`**
   - Compare weeks `Link` → `prefetch="intent"`
   - Annual charts `Link` → `prefetch="intent"`
   - Week list `Link`s (dynamic `to={/history/${week}}`) → `prefetch="intent"`

3. **`app/routes/history.$week.tsx`**
   - Back to History `Link` → `prefetch="intent"`

4. **`app/routes/history.compare.tsx`**
   - Back to History `Link` → `prefetch="intent"`

### Phase 3: Charts and settings

5. **`app/routes/charts.tsx`**
   - Error boundary "Go home" `Link` → `prefetch="intent"`
   - Back to home `Link` → `prefetch="intent"`

6. **`app/routes/settings.tsx`**
   - Back to home `Link` → `prefetch="intent"`

7. **`app/components/AnnualChartsSection.tsx`**
   - "Back to History" `Link` → `prefetch="intent"`
   - Week links (dynamic) → `prefetch="intent"`

### Phase 4: Verify CSS selectors

- Check for `nav :last-child` or similar that might break when prefetch `<link>` tags are inserted. Use `:last-of-type` if needed.

## Verification

1. **Manual:** Hover over nav links; in DevTools Network tab, verify prefetch requests for route modules/data.
2. **E2E:** Existing navigation tests should still pass; no behavior change, only performance.
3. **Lint:** No new lint issues.

## Risks

| Risk | Mitigation |
|------|------------|
| Extra bandwidth on hover | Intent only prefetches on hover/focus; users who don't click don't trigger full load. |
| Viewport prefetch bug | Use `intent`, not `viewport`. |
| CSS breakage | Audit `nav` selectors; use `:last-of-type` if prefetch tags affect layout. |

## Success Criteria

- All 16 `Link`/`NavLink` instances have `prefetch="intent"`.
- No external links or anchors modified.
- Navigation feels faster on hover-then-click.
- No regressions in E2E or layout.
