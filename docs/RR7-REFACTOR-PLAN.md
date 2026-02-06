# RR7/Remix Refactor Plan: Loader-Driven Data & Dumb Components

## Overview

Refactor the weekly-summary app to follow React Router 7 / Remix principles: **loaders for data**, **actions for mutations**, **dumb presentational components**, and **clear separation of logic from UI**. Each section loads its own data; components receive props and render.

---

## Problem Statement

**Current issues:**

1. **Data fetching in components** – `_index.tsx` uses `useFetcher().load()` in `useEffect` to fetch today and weekly data. This violates Remix’s “loaders for data” pattern and causes a render → fetch waterfall.
2. **Logic mixed with UI** – The index page handles refresh interval, loading/error states, and layout in one component.
3. **Smart components** – `FullSummaryForm` owns its fetcher, submission logic, and UI. It should be split into a dumb form and a thin container.
4. **No initial server render** – Data is fetched client-side after mount, so the first paint shows “Loading…” instead of real content.

---

## Current State Analysis

| File | Role | Issues |
|------|------|--------|
| `_index.tsx` | Page + data orchestration | `useEffect` + `useFetcher` for both today and weekly; refresh interval; loading/error handling |
| `FullSummaryForm.tsx` | Form + mutation + result display | `useFetcher` for POST; owns submission, loading, error, success, and MetricsCard |
| `MetricsCard.tsx` | Presentational | ✅ Dumb – receives `stats`, renders |
| `WeeklyTicker.tsx` | Presentational | ✅ Dumb – receives `stats`, renders |
| `api.today.ts` | Resource route | Loader only; used via fetcher |
| `api.weekly.ts` | Resource route | Loader only; used via fetcher |
| `api.summary.ts` | Resource route | Action only; used via fetcher form |

**Data flow today:** Component mounts → `useEffect` runs → `fetcher.load("/api/today")` and `fetcher.load("/api/weekly")` → UI updates when data arrives.

**Desired flow:** Route loads → loaders run in parallel → page renders with data → components receive props.

---

## Requirements

### Functional Requirements

1. **Initial load** – Today and weekly stats are loaded on first request via loaders, not client-side fetchers.
2. **Refresh** – A refresh control revalidates loader data (e.g. `useRevalidator`).
3. **Auto-refresh** – Optional 5-minute revalidation (can live in a small hook or route component).
4. **FullSummaryForm** – Form submission still uses an action; UI is split into dumb form + thin container.
5. **Error handling** – Errors from loaders are surfaced per section where applicable.

### Non-Functional Requirements

1. **Parallel loading** – Today and weekly load in parallel where possible.
2. **Dumb components** – Presentational components receive data via props; no `useFetcher` or `useLoaderData` in them.
3. **Single source of truth** – Loaders own data; components only render.
4. **Aligned with Remix** – Follows remix-performance-principles (loaders for reads, actions for mutations, no fetch-in-useEffect).

---

## Architecture Options

### Option A: Single Index Loader (Recommended)

**Structure:** One `_index` route with a loader that fetches today and weekly in parallel.

```
app/
  routes/
    _index.tsx          # loader + thin page component
    api.summary.ts      # action only (unchanged)
  components/
    TodaySection.tsx    # dumb: stats, error, isLoading, onRefresh
    WeeklySection.tsx   # dumb: stats, error
    RefreshButton.tsx   # dumb: onClick, isLoading
    MetricsCard.tsx     # dumb (unchanged)
    WeeklyTicker.tsx    # dumb (unchanged)
    FullSummaryForm/    # split
      FullSummaryForm.tsx       # dumb form UI
      FullSummaryFormRoute.tsx  # useFetcher + action, passes to dumb form
```

**Pros:** Simple, one loader, easy to reason about.  
**Cons:** Today and weekly are coupled in one loader (though they can still run in parallel inside it).

---

### Option B: Nested Routes with Per-Section Loaders

**Structure:** Layout route with child routes; each section has its own loader.

```
app/
  routes/
    _index.tsx              # layout, Outlet
    _index.today.tsx        # loader for today
    _index.weekly.tsx       # loader for weekly
    _index.summary.tsx      # FullSummaryForm (action only, no loader)
```

**Pros:** RR7 runs loaders in parallel; each section is self-contained.  
**Cons:** More routes; layout needs to coordinate sections; refresh revalidates all loaders.

---

### Option C: Resource Routes + Index Loader

**Structure:** Index loader calls `runSummary` directly (same logic as api routes) instead of fetching from api.today / api.weekly.

**Pros:** No self-fetch; single call path.  
**Cons:** Duplicates logic unless shared; api.today / api.weekly remain for direct API use.

---

## Recommended Approach: Option A

Use a single index loader and split components for clarity and maintainability.

---

## Implementation Strategy

### Phase 1: Add Index Loader

1. Add a `loader` to `_index.tsx` that:
   - Calls `runSummary` for today and weekly (or fetches from api routes server-side).
   - Returns `{ today, weekly }` with `payload` and `error` for each.
2. Remove `useFetcher` for today and weekly from the page.
3. Use `useLoaderData()` in the page component to read data.
4. Replace manual refresh with `useRevalidator().revalidate()`.

### Phase 2: Extract Dumb Components

1. **TodaySection** – Receives `{ stats, error, isLoading, onRefresh }`. Renders MetricsCard, error, loading, and a refresh control.
2. **WeeklySection** – Receives `{ stats, error }`. Renders WeeklyTicker and error.
3. **RefreshButton** – Receives `{ onClick, isLoading }`. Renders button + loading state.
4. **ErrorBanner** – Receives `{ message }`. Renders error UI.

### Phase 3: Split FullSummaryForm

1. **FullSummaryForm** (dumb):
   - Props: `{ onSubmit, isSubmitting, error, saved, stats }`.
   - Renders form fields, submit button, error/success messages, MetricsCard when `stats` exists.
   - No `useFetcher` or routing logic.

2. **FullSummaryFormContainer** (or keep logic in parent):
   - Uses `useFetcher` with `action="/api/summary"`.
   - Handles form submit, derives `isSubmitting`, `error`, `saved`, `stats` from fetcher.
   - Passes these as props to `FullSummaryForm`.

   Alternatively, keep the fetcher in `_index` and pass fetcher-derived state into a dumb `FullSummaryForm`.

### Phase 4: Auto-Refresh (Optional)

1. Add `useRevalidator` in the index page.
2. `useEffect` with `setInterval` to call `revalidate()` every 5 minutes.
3. Keep this in the route component; it is orchestration, not presentation.

### Phase 5: Cleanup

1. Remove unused fetcher logic from index.
2. Ensure api.today and api.weekly remain usable as resource routes if needed.
3. Add or update tests for loaders and components.

---

## File Changes Summary

| File | Action |
|------|--------|
| `app/routes/_index.tsx` | Add loader; use `useLoaderData`, `useRevalidator`; delegate to dumb components |
| `app/components/TodaySection.tsx` | **New** – dumb component for today stats |
| `app/components/WeeklySection.tsx` | **New** – dumb component for weekly stats |
| `app/components/RefreshButton.tsx` | **New** – dumb refresh button |
| `app/components/ErrorBanner.tsx` | **New** – dumb error display |
| `app/components/FullSummaryForm.tsx` | Refactor to dumb form; extract container or move fetcher to parent |
| `app/components/MetricsCard.tsx` | No change |
| `app/components/WeeklyTicker.tsx` | No change |
| `app/routes/api.today.ts` | Keep as resource route (optional: used by loader or direct) |
| `app/routes/api.weekly.ts` | Keep as resource route |
| `app/routes/api.summary.ts` | No change |

---

## Component Responsibility Matrix

| Component | Fetches Data? | Mutations? | Logic | Renders |
|-----------|---------------|------------|-------|---------|
| `_index` (route) | Via loader | No | Orchestration, revalidation | Layout, passes props |
| `TodaySection` | No | No | None | MetricsCard, loading, error, refresh |
| `WeeklySection` | No | No | None | WeeklyTicker, error |
| `RefreshButton` | No | No | None | Button UI |
| `FullSummaryForm` | No | No | None | Form, messages, MetricsCard |
| `MetricsCard` | No | No | None | Stats grid |
| `WeeklyTicker` | No | No | None | Inline stats |

---

## Success Criteria

1. **Functional**
   - Initial page load shows today and weekly data (or loading/error) without client fetch.
   - Refresh button revalidates and updates data.
   - FullSummaryForm still submits and shows result.
   - Optional: 5-minute auto-refresh works.

2. **Technical**
   - No `useFetcher` or `useEffect` for initial data load in presentational components.
   - Loader returns today and weekly in one round-trip (or parallel internally).
   - Presentational components are pure: same props → same output.

3. **Maintainability**
   - Clear split: loaders/actions = data, components = UI.
   - Easy to test components with mock props.
   - Easy to add or change sections without touching others.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-------------|
| Loader blocks initial render | Run today and weekly in parallel (e.g. `Promise.all`). Consider `defer()` if one is slow. |
| Breaking existing behavior | Keep api routes; loader can call `runSummary` directly. Add tests before refactor. |
| Over-abstracting | Start with Option A; only introduce nested routes if needed. |

---

## Rollback

- Refactor can be done incrementally (loader first, then components).
- Git history allows reverting specific commits.
- api.today and api.weekly remain; reverting the index to use fetchers is straightforward.
