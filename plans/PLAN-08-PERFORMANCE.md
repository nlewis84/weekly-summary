# Plan 08: Performance & Loading States

**Status: ✅ Complete**

## Problem

Improve perceived performance and loading UX.

## Current State

- Index loader fetches today + weekly in parallel (good)
- Charts loader fetches all weeks sequentially (could be slow)
- No skeleton loaders or optimistic UI
- Lottie icons load dynamically (good for SSR)

## Tasks

1. [ ] Add skeleton/placeholder for Today and Weekly while loading
2. [ ] Consider `defer()` for charts if data is slow (show partial UI)
3. [ ] Optimize `getChartsData` – parallel fetch of summaries where possible
4. [ ] Lazy-load charts route (code-split) if bundle is large
5. [ ] Ensure no layout shift when data loads (reserve space for cards)

## Success Criteria

- Users see immediate feedback (skeleton) instead of blank
- Charts load without blocking main content
- No jarring layout shifts

---

## Resolution

- MetricsCardSkeleton and WeeklyTickerSkeleton: match MetricsCard/WeeklyTicker layout, animate-pulse
- TodaySection and WeeklySection: show skeleton when isLoading && !data
- getChartsData: parallelized with Promise.all (was sequential for-loop)
- Charts route: already code-split (separate chunk when navigating)
