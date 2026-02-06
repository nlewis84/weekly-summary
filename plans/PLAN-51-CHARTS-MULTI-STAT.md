# Plan 51: Charts Multi-Stat Overhaul

**Status: Complete**  
**Priority: P2**  
**Effort: Medium**  
**Impact: High**

---

## Problem

### PRs & Linear Chart

The current "PRs & Linear" chart displays all six metrics in a single stacked area chart. This causes:

- **Stacking distortion**: Metrics with different scales (e.g., commits vs. Linear worked on) are visually conflated; individual trends are hard to read
- **No Y-axis scale**: Missing tick marks and labels make absolute values unclear
- **Visual clutter**: Six bands in one chart create cognitive load and make comparison difficult

### Repos (PRs per week) Chart

The current horizontal bar chart has presentation issues:

- **Truncated labels**: Y-axis `width={80}` cuts off repository names (e.g., "pollos-admin" appears clipped)
- **No value labels**: Bar lengths must be estimated from the axis; exact PR counts are not shown on the bars
- **Flat appearance**: Solid blue bars with minimal visual hierarchy; feels dated
- **Fixed height**: `h-72` for few repos wastes space; many repos may feel cramped

## Current Implementation

- [app/components/ChartsContent.tsx](app/components/ChartsContent.tsx) – Single stacked `AreaChart` with 6 `Area` series (`stackId="a"`); horizontal `BarChart` for repos (`layout="vertical"`, `YAxis width={80}`)
- [app/components/AnnualChartsContent.tsx](app/components/AnnualChartsContent.tsx) – Same pattern for monthly data
- Data from [lib/charts-data.ts](lib/charts-data.ts): `prs_merged`, `pr_reviews`, `pr_comments`, `commits_pushed`, `linear_completed`, `linear_worked_on`

## Design Decisions

### 1. Small Multiples (One Chart Per Metric)

**Decision**: Replace the single stacked chart with six separate charts arranged in a responsive grid.

**Rationale**:

- Each metric has its own Y-axis scale, avoiding scale distortion
- Individual trends are immediately readable
- Follows Edward Tufte's small-multiples principle: same structure, different data
- Easier to compare patterns across metrics when axes are aligned

### 2. Chart Type: Line Charts

**Decision**: Use line charts (not stacked areas) for each metric.

**Rationale**:

- Line charts are ideal for time-series trends and discrete counts
- Avoids stacking confusion; each chart shows one metric's absolute values
- Recharts `LineChart` + `Line` is already supported by the shadcn chart primitives
- Optional: light area fill under the line for emphasis (single-series area, not stacked)

### 3. Layout

**Decision**: 2×3 grid on desktop, 1-column stack on mobile.

- Desktop: `grid grid-cols-2 lg:grid-cols-3 gap-4`
- Mobile: single column for readability and touch targets

### 4. Axis and Scale Best Practices

**Decision**:

- **X-axis**: Time flows left-to-right (oldest → newest). Ensure `dataPoints` are sorted by `week_ending` ascending.
- **Y-axis**: Show numeric tick marks and start at 0 for count data (avoids misleading scale)
- **Margins**: Add `left` margin (e.g., 40px) for Y-axis labels

### 5. Grouping and Order

**Decision**: Group charts by semantic category for scanability:

1. **PR metrics**: PRs merged, PR reviews, PR comments
2. **Code activity**: Commits pushed
3. **Linear metrics**: Linear completed, Linear worked on

Order in the grid: PRs merged → PR reviews → PR comments → Commits pushed → Linear completed → Linear worked on.

### 6. Style Consistency

**Decision**:

- Use existing theme tokens: `--chart-1` through `--chart-5`; add `--chart-6` for Linear worked on (replace hardcoded `hsl(252, 70%, 65%)`)
- Keep card styling: `bg-[var(--color-surface)]`, `border-[var(--color-border)]`, `rounded-xl`
- Per-chart title: metric name as `h4` or similar
- Reuse `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` from [app/components/ui/chart.tsx](app/components/ui/chart.tsx)
- No per-chart legend (single series); optional compact legend if needed

### 7. Accessibility

**Decision**:

- Each chart gets its own `role="img"` and `aria-label` (e.g., "Line chart: PRs merged over time")
- Preserve `accessibilityLayer` on Recharts components

---

## Repos Chart Design Decisions

### 1. Label Visibility

**Decision**: Increase Y-axis width and ensure repo names are fully visible.

- Set `YAxis width` to at least 120–140px, or use `minWidth` with `overflow="visible"` so labels are not clipped
- Consider `tick={{ fontSize }}` for readability
- Alternative: show full repo name in tooltip; use truncated label with ellipsis only if space is truly constrained

### 2. Value Labels on Bars

**Decision**: Add numeric labels at the end of each bar (or inside the bar for short bars).

- Use Recharts `LabelList` with `position="right"` (or `"inside"` for long bars) to display the PR count
- Improves scannability; users don't need to align bars with the axis

### 3. Visual Refinement

**Decision**: Improve bar styling without over-designing.

- Keep horizontal bar layout (appropriate for categorical + count data)
- Add subtle bar padding/gap between bars for clarity
- Consider a light gradient or consistent fill; avoid flat single-color if it feels dull
- Ensure bars use `--chart-1` (theme token) for dark/light mode

### 4. Responsive Height

**Decision**: Make chart height proportional to data when practical.

- For few repos (e.g., ≤5): reduce height or use fixed compact height
- For many repos: allow scroll or cap visible count (e.g., top 10) with consistent row height
- Minimum touch-friendly bar height (~24px) for mobile

### 5. X-Axis Clarity

**Decision**: Keep numeric X-axis with visible ticks; ensure grid lines don't overpower the bars.

- `CartesianGrid horizontal={false}` is correct for horizontal bars
- Consider `strokeDasharray` or lighter stroke for grid

---

## Implementation Approach

### Phase 1: ChartsContent (Weekly Charts)

1. Create a reusable `MetricLineChart` component that accepts:
   - `data`: array of `{ week, value }`
   - `metricKey`: e.g. `"PRs merged"`
   - `color`: CSS variable
   - `ariaLabel`: string
2. Replace the single stacked `AreaChart` with a grid of six `MetricLineChart` instances.
3. Ensure `metricsData` is sorted by `week_ending` ascending (verify in [lib/charts-data.ts](lib/charts-data.ts) or sort in component).
4. Add Y-axis with `domain={[0, 'auto']}` and visible ticks.

### Phase 2: AnnualChartsContent

1. Apply the same small-multiples pattern to [app/components/AnnualChartsContent.tsx](app/components/AnnualChartsContent.tsx) for monthly data.
2. Reuse `MetricLineChart` or a shared abstraction if both weekly and monthly use the same structure.

### Phase 3: Theme and Polish

1. Add `--chart-6` in [app/tailwind.css](app/tailwind.css) for light and dark themes (replace `hsl(252, 70%, 65%)`).
2. Update E2E in [e2e/charts.spec.ts](e2e/charts.spec.ts): adjust selectors if needed (e.g., multiple `role="img"` for charts).
3. Update CSV export if needed (unchanged; same data).

### Phase 4: Repos Chart Redesign

1. In [app/components/ChartsContent.tsx](app/components/ChartsContent.tsx), update the Repos `BarChart`:
   - Increase `YAxis` `width` to 120–140px (or use `overflow="visible"`) to prevent label truncation
   - Add Recharts `LabelList` to `Bar` with `dataKey="PRs merged"`, `position="right"` (or `"inside"` for long bars), to show numeric PR count on each bar
   - Add `barCategoryGap` (e.g., 8–12%) for spacing between bars
   - Adjust `margin` so repo labels fit; increase left margin if needed
2. Optionally: make container height proportional to `reposData.length` (e.g., `min-h` with height derived from row count)
3. Verify tooltip still shows repo name and PR count

## File Changes Summary

- `app/components/ChartsContent.tsx` – Replace stacked AreaChart with grid of 6 line charts; redesign Repos BarChart
- `app/components/AnnualChartsContent.tsx` – Same small-multiples pattern for monthly
- `app/components/ui/chart.tsx` – No change (LineChart supported via Recharts)
- `app/tailwind.css` – Add `--chart-6` for Linear worked on
- `e2e/charts.spec.ts` – Adjust assertions for multiple charts

## Alternative Considered: Grouped Small Multiples

We could show 2–3 related metrics per chart (e.g., PRs merged + PR reviews together) to reduce vertical scroll. **Rejected** because overlapping lines in one chart still create scale/readability issues when metrics differ in magnitude.

## Success Criteria

- Six distinct charts, one per metric (PRs & Linear)
- Time flows left-to-right
- Y-axis shows numeric scale starting at 0
- Responsive grid (2–3 cols desktop, 1 col mobile)
- Theme tokens used; no hardcoded colors
- Repos chart: repo labels fully visible (no truncation), value labels on bars, improved spacing
- E2E tests pass
- Annual charts page updated consistently
