# Plan 58: Chart Tooltip Label/Value Spacing

**Status: ✅ Complete** · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** Tooltip metric names (e.g. "Commits pushed", "Linear issues created") can butt up against the hovered value when the label is long.

## Problem

On several charts (Charts page, Annual charts, MetricLineChart), the tooltip shows a metric name and its value. When the metric name is long (e.g. "Commits pushed", "Linear issues created"), it can visually butt up against the numeric value with no clear separation. Example: "Commits pushed22" instead of "Commits pushed · 22" or similar.

**Root cause:** The `ChartTooltipContent` in `app/components/ui/chart.tsx` uses a flex layout with `justify-between` but no `gap` between the label and value. The container has `min-w-[8rem]` (128px), which can be tight for longer labels.

## Affected Components

- `app/components/ui/chart.tsx` – `ChartTooltipContent` (shared by all charts)
- Charts using it: `ChartsContent.tsx`, `AnnualChartsContent.tsx`, `MetricLineChart.tsx`

## Solution Options

### Option A: Add gap to flex container (recommended)

Add a `gap` (e.g. `gap-2` or `gap-3`) to the inner flex div that holds the label and value. Ensures minimum spacing regardless of label length.

**Location:** `app/components/ui/chart.tsx` lines 229–234

```tsx
<div
  className={cn(
    "flex flex-1 justify-between gap-3 leading-none",  // add gap-3
    nestLabel ? "items-end" : "items-center"
  )}
>
```

### Option B: Increase min-width and add gap

- Increase `min-w-[8rem]` to `min-w-[10rem]` or `min-w-[12rem]` on the tooltip container (line 180)
- Add `gap-3` as in Option A

### Option C: Add visual separator

Insert a separator (e.g. `·` or `:`) between label and value for clarity. Requires slightly more layout changes.

## Recommended Approach

**Option A** – minimal change, fixes the spacing issue. If tooltips still feel cramped on very long labels (e.g. "Linear issues created"), consider Option B as a follow-up.

## Tasks

1. [x] Add `gap-3` (or `gap-2`) to the flex container in `ChartTooltipContent` that holds the label and value
2. [x] Optionally add `shrink-0` to the value span so the number never gets squeezed
3. [x] Optionally add `min-w-0` to the label container so long labels can truncate/wrap correctly within flex
4. [ ] Manually verify tooltips on: Charts page (GitHub metrics, repos), Annual charts, any MetricLineChart instances

## Success Criteria

- Metric name and value in chart tooltips have clear visual separation
- No regression on charts with short labels (e.g. "PRs merged")
- Works for longest labels: "Linear issues created", "Commits pushed"
