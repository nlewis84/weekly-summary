# Plan 53: Repos Chart – Presentation Options

**Status: ✅ Complete**  
**Priority: P2**  
**Effort: TBD (depends on option)**  
**Impact: Medium**

---

## Problem

The "Repos (PRs per week)" chart currently shows a horizontal bar chart of top 10 repos by **total** PRs merged (aggregated across all weeks). This differs from the other charts, which show **usage over time** (line charts with weeks on the X-axis).

The user wants to know the most active repos but feels there are more options for how to present this data. The current chart:

- **Title mismatch**: Says "PRs per week" but displays total PRs (all-time)
- **No time dimension**: Unlike PRs & Linear charts, repos don't show trends over time
- **Single view**: Only answers "which repos have the most PRs?" — other questions (e.g., when, how concentrated, recent vs. historical) are unanswered

## Current Data Available

From [lib/charts-data.ts](lib/charts-data.ts):

```ts
interface RepoActivity {
  repo: string;
  weeks: { week_ending: string; prs: number }[];  // per-week breakdown
  total_prs: number;
}
```

- **Source**: `payload.github.merged_prs` — each PR has `repo`
- **Per-week data exists**: `weeks` array has `{ week_ending, prs }` for each repo
- **Limitation**: Only merged PRs have repo attribution; reviews/comments do not (per [lib/types.ts](lib/types.ts))

## Presentation Options

### Option A: Most Active (Current, Refined)

**What**: Horizontal bar chart of top N repos by total PRs merged.

**Pros**: Simple, answers "where do I spend most of my time?" at a glance.

**Cons**: No time dimension; title "PRs per week" is misleading (should be "Total PRs merged").

**Changes**: Fix title to "Most Active Repos (Total PRs merged)" or similar; keep current layout.

---

### Option B: Repos Over Time (Line Chart)

**What**: Line chart with weeks on X-axis; one line per repo (top 5–8 repos). Each line shows PRs merged per week for that repo.

**Pros**: Aligns with other charts (usage over time); shows when activity spiked or dropped per repo; answers "when was I most active in repo X?"

**Cons**: Many lines can overlap and become hard to read; need color differentiation; legend required.

**Implementation**: Use `repoActivity.weeks` to build `{ week, repo1, repo2, ... }` data; render multiple `Line` series. Consider limiting to top 5–6 repos by total PRs.

---

### Option C: Stacked Area (Repos Over Time)

**What**: Stacked area chart with weeks on X-axis; each band = one repo's PRs that week. Total height = total PRs that week.

**Pros**: Shows both total weekly PRs and repo contribution; visually consistent with "usage over time"; easy to see which repos dominate each week.

**Cons**: Many repos → many thin bands, hard to distinguish; "Other" bucket may be needed for repos beyond top 5–6.

**Implementation**: Pivot `repoActivity.weeks` into `{ week, repoA, repoB, ..., other }`; stack areas. Recharts `AreaChart` with multiple `Area` and `stackId`.

---

### Option D: Heatmap

**What**: Rows = repos (top 10–15), columns = weeks. Cell color intensity = PR count.

**Pros**: Compact; great for spotting patterns (e.g., "I was heavy on repo X in Jan, switched to Y in Feb"); no overlapping lines.

**Cons**: Less common chart type; may need custom component or different library; exact values require tooltip/hover.

**Implementation**: Custom grid or library (e.g., Nivo heatmap, or simple CSS grid with `background` scaled by value).

---

### Option E: View Toggle (Most Active vs. Over Time)

**What**: Tabs or toggle: "Most active" (bar chart) | "Over time" (line or stacked area).

**Pros**: Serves both use cases; user chooses what they care about.

**Cons**: More UI; two chart implementations to maintain.

**Implementation**: State for `view: "total" | "overtime"`; render appropriate chart. Reuse `repoActivity` for both.

---

### Option F: Pareto / Concentration

**What**: Bar chart of repos + cumulative % line. Shows "top 3 repos = 70% of my PRs" type insight.

**Pros**: Answers "how concentrated is my work?"; useful for portfolio balance or focus analysis.

**Cons**: More analytical; may feel over-engineered for casual use.

**Implementation**: Compute cumulative %; dual-axis chart (bars + line) or separate summary text.

---

### Option G: Recent vs. All-Time

**What**: Filter or compare: "Last 4 weeks" vs. "All time" — show which repos are hot recently vs. historically.

**Pros**: Surfaces "I'm shifting focus" or "this repo is newly active"; avoids stale totals dominating.

**Cons**: Requires time-range state; two data slices.

**Implementation**: Add `timeRange` state; filter `repoActivity.weeks` by date before aggregating; or show two small charts side-by-side.

---

### Option H: Treemap

**What**: Rectangles sized by total PRs; each rectangle = one repo. Larger = more PRs.

**Pros**: Visual hierarchy; space-efficient; intuitive "bigger = more."

**Cons**: Less precise for exact counts; can feel gimmicky; Recharts Treemap may need extra config.

**Implementation**: Recharts `Treemap` with `dataKey="total_prs"`; `nameKey="repo"`.

---

## Recommendation Matrix

| Option | Answers "Most active?" | Shows trends? | Aligns with other charts? | Effort |
|--------|------------------------|---------------|---------------------------|--------|
| A (Refined) | ✅ | ❌ | ❌ | Low |
| B (Line) | ✅ (via sort) | ✅ | ✅ | Medium |
| C (Stacked) | ✅ | ✅ | ✅ | Medium |
| D (Heatmap) | ✅ | ✅ | Partial | Medium–High |
| E (Toggle) | ✅ | ✅ | ✅ | Medium |
| F (Pareto) | ✅ | ❌ | ❌ | Medium |
| G (Recent) | ✅ | ✅ | Partial | Medium |
| H (Treemap) | ✅ | ❌ | ❌ | Low–Medium |

---

## Suggested Path

1. **Quick win**: Fix title (Option A) — "Most Active Repos" or "Repos by PRs merged (all time)" so it's accurate.

2. **Primary enhancement**: Add **Option B (Repos Over Time)** or **Option E (View Toggle)**.
   - If you want consistency with other charts: **Option B** — single line chart, top 5–6 repos.
   - If you want flexibility: **Option E** — toggle between "Most active" (bar) and "Over time" (line).

3. **Future**: Option D (heatmap) or G (recent vs. all-time) could be added later if user feedback warrants.

---

## Data Considerations

- **ChartsContent** receives `repoActivity: { repo: string; total_prs: number }[]` — the `weeks` array is dropped at the component boundary. To support over-time views, pass full `RepoActivity` (including `weeks`) from the loader.
- **AnnualChartsContent** does not currently show repos; `getAnnualData` returns `topRepos` but it's not rendered. A separate plan could add annual repo charts.

---

## Tasks (for chosen option)

- [ ] Decide which option(s) to implement
- [ ] Update `ChartsContent` props to receive `repoActivity` with `weeks` if over-time view needed
- [ ] Implement chosen chart(s)
- [ ] Fix chart title for accuracy
- [ ] Add view toggle UI if Option E
- [ ] Update E2E in `e2e/charts.spec.ts` if selectors change
- [ ] Consider adding repos to Annual dashboard if desired

---

## Success Criteria

- Chart title accurately describes what is shown
- If over-time view: repos chart aligns conceptually with PRs & Linear (usage over time)
- User can answer both "most active repos" and "when was I active in repo X?" (if Option B or E)
- No regressions in existing chart behavior
