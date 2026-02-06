# Plan 55: Integrate Annual Dashboard into Charts Page

**Status: 🔲 Pending** · **Priority: P2** · **Effort: Medium** · **Impact: High**

**Validated Feb 2026:** Charts and Annual remain separate routes (`/charts` vs `/history/annual`). No Weekly/Annual tab on Charts. Still relevant.

---

## Problem

The **Annual Dashboard** (`/history/annual`) is highly valued—it shows year-over-year metrics, monthly trends, top repos, top Linear projects, and year comparison. But it lives under History and is only discoverable via a small "Annual" link on the History index page. Users who go to **Charts** for progress visualization never see it.

**Current state:**
- **Charts** (`/charts`): Weekly granularity—PRs & Linear metrics, repos over time. Linked from main nav.
- **Annual** (`/history/annual`): Monthly granularity—aggregate totals, monthly trends, top repos/projects, year comparison. Buried under History.

Both answer "how is my productivity trending?" at different time scales. They belong together.

---

## Goals

1. **Discoverability**: Users visiting Charts should see annual data without hunting under History.
2. **Unified mental model**: One place for "progress & analytics" at weekly and annual scales.
3. **Preserve History link**: Annual remains accessible from History for users who think of it as "year view of my summaries."

---

## Proposed Approach

### Option A: Tabs on Charts Page (Recommended)

Add a **view toggle** at the top of the Charts page: **Weekly** | **Annual**

- **Weekly** (default): Current ChartsContent—weekly metrics, repos chart.
- **Annual**: Embed the annual dashboard content (metric cards, monthly trend, top repos, top projects, year selector, compare mode).

**Pros:**
- Single URL (`/charts`), no route changes.
- Clear mental model: "Charts = all my progress views."
- Annual is one click away from Charts nav.

**Cons:**
- Charts loader must fetch both datasets (or lazy-load annual on tab switch).
- Slightly heavier Charts page.

### Option B: Charts as Parent Route with Child Views

Restructure routes: `/charts` (layout) → `/charts/weekly` and `/charts/annual` as child routes.

**Pros:**
- Clean separation, each view has its own loader.
- Deep-linkable: `/charts/annual?year=2025&compare=2024`.

**Cons:**
- More routing complexity.
- Nav would need to point to `/charts` (layout) or require sub-nav.

### Option C: Annual as First-Class Section on Charts (No Tabs)

Render both on the same page: Weekly charts first, then Annual dashboard below (or vice versa).

**Pros:**
- No interaction needed—everything visible on scroll.
- Simple implementation.

**Cons:**
- Long page, potential performance hit (two full data fetches).
- May feel overwhelming; weekly and annual answer different questions at once.

---

## Recommendation: Option A (Tabs)

- **Effort**: Medium. Reuse existing `AnnualChartsContent`, `MetricCard`, `CompareTotals`, top repos/projects from `history.annual.tsx`.
- **UX**: Familiar tab pattern (like repos "Most active" | "Over time").
- **Performance**: Load annual data only when user switches to Annual tab (lazy loader or client-side fetch).

---

## Implementation Tasks

### Phase 1: Integrate Annual into Charts (Core)

1. [ ] Add view state to Charts page: `"weekly" | "annual"` (default: `"weekly"`).
2. [ ] Add tab UI: "Weekly" | "Annual" (styled like repos view toggle).
3. [ ] Extend Charts loader to optionally fetch annual data, or add a separate loader/fetch for annual when tab is "annual".
4. [ ] Extract reusable components from `history.annual.tsx`:
   - `MetricCard`, `CompareTotals` (or inline if simple)
   - Top repos list, top projects list, weeks grid
5. [ ] Render annual content when tab is "annual": year selector, compare dropdown, metric cards, `AnnualChartsContent`, top repos, top projects, weeks links.
6. [ ] Preserve `/history/annual` route—either redirect to `/charts?view=annual` or keep as duplicate entry point (both work).

### Phase 2: URL State & Deep Linking

1. [ ] Sync tab to URL: `/charts?view=annual` or `/charts/annual` (if using Option B).
2. [ ] Support `?year=2025` and `?compare=2024` on Charts page when in annual view.
3. [ ] Ensure back/forward and bookmarking work correctly.

### Phase 3: Polish & Consistency

1. [ ] Ensure annual section uses same card styling as weekly (border, surface, etc.).
2. [ ] Add CSV export for annual view (year totals as one row, or monthly breakdown).
3. [ ] Update History index: change "Annual" link to point to `/charts?view=annual` (or keep both—History link goes to `/history/annual` which could redirect).
4. [ ] Update nav label if desired: "Charts" could become "Progress" or stay "Charts" with tooltip "Weekly & annual views."

### Phase 4: Optional Enhancements

1. [ ] Add "Annual" as a nav dropdown or secondary link under Charts (e.g., "Charts" nav with sub-item "Annual").
2. [ ] Add annual repo chart (PLAN-53 noted `topRepos` exists but isn’t charted—could add bar chart of top repos for selected year).
3. [ ] Consider removing `/history/annual` route if fully redundant, or keep as alias for `/charts?view=annual`.

---

## Data Loading Strategy

| Approach | When to fetch | Pros | Cons |
|----------|---------------|------|------|
| **Eager** | Load both in Charts loader | No loading state on tab switch | Heavier initial load |
| **Lazy** | Fetch annual when user clicks Annual tab | Lighter initial load | Brief loading state on first switch |
| **Parallel** | Load both in parallel, cache | Fast tab switch after first load | More memory |

**Recommendation**: Lazy load annual data on first tab switch. Use `useFetcher` or a dedicated loader that runs when `view=annual` is in URL/searchParams. Keeps Charts page fast for users who only want weekly view.

---

## Success Criteria

- [ ] Users can access annual dashboard from Charts page (tab or section).
- [ ] Annual view includes: year selector, compare mode, metric cards, monthly trend charts, top repos, top projects, weeks links.
- [ ] `/history/annual` still works (redirect or duplicate).
- [ ] No regressions in weekly Charts, CSV export, or E2E tests.
- [ ] URL supports `?view=annual&year=2025&compare=2024` for sharing/bookmarking.

---

## Related Plans

- [PLAN-29-ANNUAL-DASHBOARD](PLAN-29-ANNUAL-DASHBOARD.md) – Original annual dashboard
- [PLAN-44-COMPARE-ANNUAL](PLAN-44-COMPARE-ANNUAL.md) – Year comparison
- [PLAN-54-PROGRESS-CHARTS-REDESIGN](PLAN-54-PROGRESS-CHARTS-REDESIGN.md) – Charts page structure
- [PLAN-53-REPOS-CHART-OPTIONS](PLAN-53-REPOS-CHART-OPTIONS.md) – Repos view toggle (pattern to reuse)
