# Plan 76: Metrics & This Week Card Headers – Match Build Weekly Summary

**Status:** Draft · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** Align the Metrics and This Week card headers and top dividers to match the Build Weekly Summary card so all three cards share a consistent visual pattern.

## Problem

- **Current state:** Build Weekly Summary uses a distinct header pattern (`px-5 py-4`, `font-medium`, icon + text). Metrics and This Week cards use different padding (`p-5` on card, `pb-4` on header), different typography (`font-semibold`, `text-lg`/`text-base`), and slightly different structure.
- **User request:** Make the Metrics and This Week headers match the Build Weekly Summary header. Make the top divider match the divider on that card.

## Build Weekly Summary Reference (Target)

| Element | Styling |
|---------|---------|
| **Header** | `flex items-center gap-2 px-5 py-4 font-medium text-(--color-text)` |
| **Header icon** | Phosphor icon `size={20}` `weight="regular"` `className="text-primary-500 shrink-0"` |
| **Content wrapper** | `px-5 pb-5 pt-4 border-t border-(--color-border)` |
| **Card padding** | No outer `p-5`; header and content each have their own `px-5` |

Key details:

- Header has `py-4` (16px top/bottom), not `pb-4` with inherited padding.
- Header uses `font-medium`, not `font-semibold`.
- Content divider: `border-t border-(--color-border)` with `pt-4` on the content block (already matches in Metrics and This Week).

## Current State

### MetricsCard

- Card: `p-5` (20px all sides)
- Header: `flex items-center justify-between pb-4` — no icon, `text-lg font-semibold`
- Content: `pt-4 border-t border-(--color-border)` ✓ (divider matches)
- Content needs `px-5 pb-5` instead of inheriting from card `p-5`

### WeeklyTicker (This Week)

- Card: `p-5`
- Header: `flex items-center justify-between pb-4` — CalendarBlank icon, `text-base font-semibold`
- Content: `pt-4 border-t border-(--color-border)` ✓ (divider matches)
- Content needs `px-5 pb-5` instead of inheriting from card `p-5`

## Solution

### 1. Card structure

Remove `p-5` from both cards. Apply padding per section like Build Summary:

- Header: `px-5 py-4`
- Content: `px-5 pb-5 pt-4 border-t border-(--color-border)`

### 2. Header alignment

| Change | MetricsCard | WeeklyTicker |
|--------|-------------|--------------|
| **Padding** | Header: `px-5 py-4` (replace `pb-4`) | Same |
| **Typography** | `font-medium` instead of `font-semibold`; `text-base` to match Build | Same |
| **Icon** | Add ChartBar (or ChartLine) `size={20}` before "Metrics" | Keep CalendarBlank `size={20}` |
| **Layout** | `flex items-center justify-between`; left: `flex items-center gap-2` (icon + text) | Already has icon; ensure same structure |

### 3. Content wrapper

- **MetricsCard:** Add `px-5 pb-5` to the content div (it has `pt-4 border-t`; ensure it doesn’t rely on card `p-5`).
- **WeeklyTicker:** Same — content div gets `px-5 pb-5` explicitly.

### 4. Divider

Both already use `pt-4 border-t border-(--color-border)` on the content. No change needed; verify it visually matches Build Summary after padding changes.

## Affected Files

| File | Changes |
|------|---------|
| `app/components/MetricsCard.tsx` | Remove `p-5` from card; header: `px-5 py-4`, `font-medium`, add icon; content: `px-5 pb-5` |
| `app/components/WeeklyTicker.tsx` | Remove `p-5` from card; header: `px-5 py-4`, `font-medium`; content: `px-5 pb-5` |
| `app/components/MetricsCardSkeleton.tsx` | Match structure (header/content padding) |
| `app/components/WeeklyTickerSkeleton.tsx` | Match structure (header/content padding) |

## Implementation Details

### MetricsCard.tsx

**Before (header):**
```tsx
<div className="flex items-center justify-between pb-4">
  <h2 className="text-lg font-semibold text-(--color-text)">Metrics</h2>
```

**After (header):**
```tsx
<div className="flex items-center justify-between px-5 py-4">
  <h2 className="flex items-center gap-2 font-medium text-(--color-text)">
    <ChartBar size={20} weight="regular" className="text-primary-500 shrink-0" />
    Metrics
  </h2>
```

**Before (card):**
```tsx
<div className="... p-5 ...">
```

**After (card):**
```tsx
<div className="...">
```
(Remove `p-5` from card wrapper.)

**Content div:** Add `px-5 pb-5` to the content div that has `pt-4 border-t`.

### WeeklyTicker.tsx

**Before (header):**
```tsx
<div className="flex items-center justify-between pb-4">
  <h2 className="flex items-center gap-2 text-base font-semibold text-(--color-text)">
```

**After (header):**
```tsx
<div className="flex items-center justify-between px-5 py-4">
  <h2 className="flex items-center gap-2 font-medium text-(--color-text)">
```

**Before (card):**
```tsx
<div className="... p-5 ...">
```

**After (card):**
```tsx
<div className="...">
```

**Content div:** Add `px-5 pb-5` to the content div (it has `pt-4 border-t`).

### Skeletons

Update MetricsCardSkeleton and WeeklyTickerSkeleton to use the same header/content padding structure so loading states match.

## Icon choice for Metrics

Build Summary uses `FileText`. For Metrics, use `ChartBar` or `ChartLine` from phosphor-react. `ChartBar` is a good fit for a metrics/stats card.

## Tasks

1. [ ] MetricsCard: Remove `p-5`, add `px-5 py-4` to header, `font-medium`, add ChartBar icon, add `px-5 pb-5` to content
2. [ ] WeeklyTicker: Remove `p-5`, add `px-5 py-4` to header, change to `font-medium`, add `px-5 pb-5` to content
3. [ ] MetricsCardSkeleton: Match header/content padding structure
4. [ ] WeeklyTickerSkeleton: Match header/content padding structure
5. [ ] Manually verify all three cards look consistent (header, divider, spacing)
6. [ ] Update `docs/STYLE-GUIDE.md` if card header pattern changes

## Success Criteria

- Metrics and This Week headers visually match Build Weekly Summary (padding, typography, icon placement)
- Top divider on all three cards is identical (`border-t border-(--color-border)` with `pt-4`)
- No regression on mobile or tablet
- Skeletons match the new structure
