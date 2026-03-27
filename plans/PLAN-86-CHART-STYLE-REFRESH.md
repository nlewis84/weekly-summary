# Plan: Chart Style Refresh

**Status: ✅ Complete** · **Priority: P2**

## Problem

The small metric line charts (PRs merged, Linear completed, etc.) use dots on every data point which adds visual noise, and there's no reference point for understanding whether a value is above or below the norm.

## Changes

### Smooth line, no dots (`app/components/MetricLineChart.tsx`)

- Remove dots from the line (set `dot={false}`)
- Keep `activeDot` so hovering still highlights the point
- Bump `strokeWidth` from 2 to 2.5 for a slightly bolder, cleaner line
- Keep `type="monotone"` for smooth curves

### Flat average reference line (`app/components/MetricLineChart.tsx`)

- Compute the mean of all data values
- Add a Recharts `<ReferenceLine>` at the average with a dashed stroke, subtle color, and no label

## Files changed

| File | Change |
|------|--------|
| `app/components/MetricLineChart.tsx` | Remove dots, bump stroke width, add dashed average ReferenceLine |
