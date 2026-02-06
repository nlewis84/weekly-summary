# PLAN-60: API Caching to Reduce Request Burn

**Status:** Done

## Overview

Add server-side caching (15-minute TTL) for expensive API calls (Linear, GitHub). Manual refresh via the Refresh button (or `r` key) busts the cache so users get fresh data on demand.

## Background

The app burns API requests on every loader run:

| Route | API Calls | Notes |
|-------|-----------|-------|
| **Index** | Linear (user + completed + worked-on + created) × 3 windows; GitHub (PRs, reviews, commits) × 3 | Today, Yesterday, Weekly run in parallel |
| **Charts** | GitHub `listWeeklySummaries` + `fetchWeeklySummary` per week; annual view adds more fetches | N+1 pattern for weekly data |
| **History** | `listWeeklySummaries` + `fetchWeeklySummary` per week | Same GitHub calls |

Linear and GitHub both have rate limits. Frequent refreshes (including auto-refresh every 5 min) compound quickly.

## Goals

1. **15-minute cache** – Serve cached data for 15 minutes to avoid redundant API calls.
2. **Refresh busts cache** – When user clicks Refresh or presses `r`, bypass cache and fetch fresh data.
3. **Transparent** – No UX change except faster responses when cache hits.

## Scope

### In scope

- Index loader (today, yesterday, weekly)
- Charts loader (weekly + annual data)
- History loaders (weeks list, week detail)
- Refresh button and `r` shortcut on Index
- Retry/refresh on Charts and History error states

### Out of scope

- **api.summary action** (POST) – User-initiated build; always fresh.
- **api.today / api.weekly** – Resource routes; can be deprecated or cached separately if still used.
- **Redis/external cache** – Start with in-memory; add Redis later if needed for multi-instance.

## Design

### Cache Layer

Create `lib/cache.ts`:

```ts
// In-memory cache: Map<key, { data, expiresAt }>
// - get(key): returns data if not expired, else null
// - set(key, data, ttlMs): stores with expiry
// - bust(key): removes entry
// - bustAll(): clears entire cache
```

**TTL:** 15 minutes (900_000 ms), configurable via `CACHE_TTL_MS` env.

### Cache Keys

| Key | Source | Used by |
|-----|--------|---------|
| `index:today` | `runSummary({ todayMode: true })` | Index loader |
| `index:yesterday` | `runSummary({ yesterdayMode: true })` | Index loader |
| `index:weekly` | `runSummary({ todayMode: false })` + prev week | Index loader |
| `charts:data` | `getChartsData()` | Charts loader |
| `charts:annual:{year}` | `getAnnualData(year)` | Charts loader |
| `charts:years` | `getAvailableYears()` | Charts loader |
| `history:weeks` | `listWeeklySummaries()` | History index, Charts |
| `history:week:{week}` | `fetchWeeklySummary(week)` | History week, Charts, Index (prev week) |

**Shared keys:** `history:weeks` and `history:week:*` are used by both History and Charts. Caching at the lib layer (e.g. in `github-fetch.ts` or a cache wrapper) ensures one fetch serves both.

### Bust Signal

When user clicks **Refresh** or presses **r**, we need the loader to bypass cache. Options:

| Option | How | Pros | Cons |
|--------|-----|------|------|
| **A: URL param** | Add `?_bust=timestamp` to URL; loader checks and skips cache | Simple, no new API | URL briefly shows param |
| **B: Header** | Custom header `X-Cache-Bust: 1` | Clean URL | `revalidate()` doesn't send custom headers |
| **C: POST cache-bust** | POST to `/api/cache-bust` then revalidate | Explicit | Two round trips |

**Recommendation: Option A.** Use `_bust` query param. On Refresh:

1. `setSearchParams(prev => { next.set('_bust', Date.now()); return next; })`
2. Navigation triggers loader with new URL
3. Loader sees `_bust` → bypass cache, fetch fresh
4. Optional: `useEffect` to remove `_bust` from URL after load (keeps URL clean)

### Cache Placement

Two approaches:

**A: Cache in loaders** – Each loader checks cache, fetches on miss, stores result. Keys are route-specific.

**B: Cache in lib layer** – Wrap `runSummary`, `getChartsData`, `fetchWeeklySummary`, etc. with a cache helper. Loaders pass `bust: boolean` from `url.searchParams.get('_bust')`.

**Recommendation: B.** Centralize cache logic in lib. Loaders stay thin; cache keys align with data shape.

## Implementation

### Phase 1: Cache Module

1. **Create `lib/cache.ts`**
   - `createCache<T>(ttlMs: number)` returns `{ get, set, bust, bustAll }`
   - In-memory `Map<string, { data: T; expiresAt: number }>`
   - Export singleton: `export const dataCache = createCache(15 * 60 * 1000)`

### Phase 2: Cache Wrappers for Data Fetchers

2. **Wrap `runSummary`** (or create `getCachedSummary` in a new module)
   - Keys: `index:today`, `index:yesterday`, `index:weekly`
   - Accept `bust?: boolean`; if true, skip cache and overwrite

3. **Wrap `getChartsData`** in `lib/charts-data.ts`
   - Key: `charts:data`
   - Add optional `bust` param

4. **Wrap `getAnnualData`** and `getAvailableYears` in `lib/annual-data.ts`
   - Keys: `charts:annual:{year}`, `charts:years`
   - Add optional `bust` param

5. **Wrap `listWeeklySummaries` and `fetchWeeklySummary`** in `lib/github-fetch.ts`
   - Keys: `history:weeks`, `history:week:{week}`
   - Add optional `bust` param (or a module-level `setBustNext()` for request-scoped bust)

**Bust propagation:** Loaders receive `request`; they parse `new URL(request.url).searchParams.get('_bust')` and pass `bust: !!bustParam` to cached functions.

### Phase 3: Loader Updates

6. **Index loader** (`app/routes/_index.tsx`)
   - Parse `url.searchParams.get('_bust')`
   - Pass `bust` to cached summary fetches

7. **Charts loader** (`app/routes/charts.tsx`)
   - Parse `_bust`
   - Pass `bust` to `getChartsData`, `getAnnualData`, `getAvailableYears`

8. **History loaders** (`history._index`, `history.$week`, etc.)
   - Parse `_bust`
   - Pass `bust` to `listWeeklySummaries`, `fetchWeeklySummary`

### Phase 4: Refresh Button and Retry

9. **Index page** – Update `handleRefresh`:
   ```ts
   const [searchParams, setSearchParams] = useSearchParams();
   const handleRefresh = () => {
     setSearchParams(prev => {
       const next = new URLSearchParams(prev);
       next.set('_bust', Date.now().toString());
       return next;
     });
   };
   ```
   - Add `useSearchParams` (Index doesn't use it today; need to preserve any existing params, e.g. from hash)
   - Optional: `useEffect` to strip `_bust` after load completes (cleaner URL)

10. **Charts page** – Add Refresh button (or ensure ErrorBanner `onRetry` busts cache)
    - Charts has `onRetry={() => revalidator.revalidate()}` – that re-runs loader with same URL
    - Change to: `onRetry` sets `_bust` param (same pattern as Index)
    - Add explicit Refresh button in Charts header for consistency

11. **History pages** – Update `onRetry` in ErrorBanner to set `_bust` before revalidate
    - Pass `setSearchParams` or a custom `onRetry` that does both

**Note:** `revalidator.revalidate()` re-runs the loader with the **current** URL. So we must **change the URL first** (add `_bust`), which triggers a navigation and loader run. We don't need to call `revalidate()` explicitly—setting search params will trigger it. But if we want to keep the loading state from `revalidator`, we can: `setSearchParams(...)` then `revalidator.revalidate()`. Actually, `setSearchParams` will trigger a navigation, which will run the loader. The revalidator will also run. So we might get a double run. Safer: **only** use `setSearchParams` with `_bust`—that navigation will run the loader. We don't need to call `revalidate()` when we're changing the URL. So the flow is:
- `handleRefresh` = `setSearchParams` with `_bust`
- Remove `revalidator.revalidate()` from handleRefresh when we're using the param approach? No—actually when we setSearchParams, React Router will treat it as navigation and run the loader. So we don't need revalidate. But the auto-refresh interval currently calls `revalidator.revalidate()`—that doesn't change the URL, so we need to decide: should auto-refresh bust cache or use cache?
- **Auto-refresh:** User has chosen an interval (e.g. 5 min). Each tick, we want fresh data. So auto-refresh should also bust cache. That means we add `_bust` on each auto-refresh tick too. So the flow is the same: `setSearchParams` with `_bust`. The interval would call `handleRefresh` which sets `_bust`. Good.

### Phase 5: Clean Up URL (Optional)

12. **Strip `_bust` after load** – In Index, Charts, History:
    - `useEffect` that runs when `loaderData` is ready and `searchParams.get('_bust')` exists: `setSearchParams` to remove `_bust`
    - Prevents URL from staying `?_bust=1234567890` indefinitely

## File Summary

| File | Changes |
|------|---------|
| `lib/cache.ts` | **New** – Cache module |
| `lib/summary.ts` | Add cache wrapper or `getCachedRunSummary`; accept `bust` |
| `lib/charts-data.ts` | Add cache around `getChartsData`; accept `bust` |
| `lib/annual-data.ts` | Add cache around `getAnnualData`, `getAvailableYears`; accept `bust` |
| `lib/github-fetch.ts` | Add cache around `listWeeklySummaries`, `fetchWeeklySummary`; accept `bust` |
| `app/routes/_index.tsx` | Parse `_bust`; pass to fetchers; `handleRefresh` sets `_bust`; add `useSearchParams` |
| `app/routes/charts.tsx` | Parse `_bust`; pass to fetchers; add Refresh button; `onRetry` sets `_bust` |
| `app/routes/history._index.tsx` | Parse `_bust`; pass to fetchers; `onRetry` sets `_bust` |
| `app/routes/history.$week.tsx` | Parse `_bust`; pass to fetchers; `onRetry` sets `_bust` |
| `app/routes/history.annual.tsx` | Parse `_bust`; pass to fetchers |
| `app/routes/history.compare.tsx` | Parse `_bust`; pass to fetchers |

## Edge Cases

| Case | Behavior |
|------|----------|
| **First load** | No cache; fetch; store with 15 min TTL |
| **Navigate away and back within 15 min** | Cache hit; instant load |
| **Auto-refresh tick** | Same as manual refresh: set `_bust`, fetch fresh |
| **Multiple tabs** | Each tab has own in-memory cache (per process). For multi-tab, consider `sessionStorage` or shared worker—out of scope for v1. |
| **Server restart** | Cache cleared; first request fetches fresh |
| **Build summary (POST)** | No cache; always runs `runSummary` |

## Verification

1. **Manual:** Load Index, wait 1 min, navigate away and back—should be instant (cache hit).
2. **Manual:** Load Index, click Refresh—should show loading, then fresh data.
3. **Manual:** Load Charts, switch to Annual, back to Weekly—cache hit for weekly data.
4. **E2E:** Existing tests should pass; add test for cache (optional: mock cache module).
5. **Rate limits:** Monitor Linear/GitHub rate limit headers; verify fewer requests over time.

## Success Criteria

- 15-minute cache reduces API calls for repeat visits and navigation.
- Refresh button and `r` key always return fresh data.
- No regressions in E2E or UX.
- Cache can be disabled via `CACHE_TTL_MS=0` for debugging.
