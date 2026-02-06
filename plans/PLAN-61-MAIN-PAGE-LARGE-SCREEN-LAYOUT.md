# Plan 61: Main Page Large-Screen Layout

**Status:** ✅ Executed · **Priority: P2** · **Effort: Small–Medium** · **Impact: Medium**

**Created Feb 2026:** On large screens, the main page content stretches edge-to-edge, making metrics cards, the Build Summary form, and the weekly ticker feel overly wide. This plan restacks content, makes components more compact, and uses side-by-side layouts to better utilize horizontal space on desktop.

## Problem

The main page (`/`) has no layout optimization for large monitors:

- **Metrics card** – 2-column grid (`sm:grid-cols-2`) stretches across the full viewport; each metric cell becomes very wide
- **Build Weekly Summary** – Full-width textarea and form feel sprawling
- **This week (WeeklyTicker)** – 6-column grid (`lg:grid-cols-6`) on large screens spreads cards across the entire width
- **Layout** – Everything stacks vertically, wasting horizontal space on wide screens

**Root cause:** `app/routes/_index.tsx` uses a simple vertical stack (`space-y-6`) with no responsive grid layout for large screens.

## Affected Files

| File | Role |
|------|------|
| `app/routes/_index.tsx` | Index page layout - needs two-column grid on xl |
| `app/components/MetricsCard.tsx` | Today/Yesterday metrics grid - make more compact on xl |
| `app/components/WeeklyTicker.tsx` | This week metrics grid - reduce card size/padding on xl |
| `app/components/FullSummaryForm.tsx` | Build Summary form - reduce textarea rows on xl |

## Solution Approach

### Two-Column Layout on Large Screens (xl: 1280px+)

1. **Restack content**: On `xl` breakpoint, create a two-column grid:
   - **Left column**: Today/Yesterday section (MetricsCard) - takes ~60% width
   - **Right column**: Build Summary form (FullSummaryFormContainer) - takes ~40% width
   - **Below**: WeeklyTicker spans full width

2. **Make components more compact**:
   - **MetricsCard**: Change grid from `sm:grid-cols-2` to `sm:grid-cols-2 xl:grid-cols-3` (3 columns on xl)
   - **MetricsCard**: Reduce padding on xl (`p-6` → `p-4 xl:p-5`)
   - **WeeklyTicker**: Reduce padding and card sizes on xl (`p-4` → `p-3 xl:p-4`)
   - **FullSummaryForm**: Reduce textarea rows on xl (`rows={6}` → `rows={4} xl:rows={5}`)

3. **Responsive behavior**:
   - Mobile/tablet: Keep current vertical stack
   - Large screens (xl): Side-by-side layout with compact components
   - Use Tailwind breakpoints: `xl:` (1280px) for the two-column layout

## Implementation Details

### `app/routes/_index.tsx`

Wrap TodaySection and FullSummaryFormContainer in a responsive grid:

```tsx
<div className="space-y-6">
  {/* Tab switcher - full width */}
  <div role="tablist" ...>
  
  {/* Two-column layout on xl */}
  <div className="xl:grid xl:grid-cols-[1.5fr_1fr] xl:gap-6 xl:items-start">
    {/* Left: Today/Yesterday */}
    <div className="space-y-6">
      {viewMode === "today" && <TodaySection ... />}
      {viewMode === "yesterday" && <TodaySection ... />}
    </div>
    
    {/* Right: Build Summary */}
    <div id="build-summary" className="xl:sticky xl:top-6">
      <FullSummaryFormContainer />
    </div>
  </div>
  
  {/* WeeklyTicker - full width below */}
  <WeeklySection ... />
</div>
```

### `app/components/MetricsCard.tsx`

- Grid: `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`
- Padding: `p-6 xl:p-5`
- Gap: `gap-4 xl:gap-3`

### `app/components/WeeklyTicker.tsx`

- Padding: `p-4 xl:p-3`
- Grid gap: `gap-3 xl:gap-2.5`
- Card padding: `p-3 xl:p-2.5`

### `app/components/FullSummaryForm.tsx`

- Textarea rows: `rows={6} xl:rows={5}`
- Consider making form more compact on xl

## Tasks

1. [x] Update `app/routes/_index.tsx` to add two-column grid layout on xl breakpoint
2. [x] Make MetricsCard more compact: 3-column grid on xl, reduce padding
3. [x] Make WeeklyTicker more compact: reduce padding and gaps on xl
4. [x] Make FullSummaryForm more compact: reduce textarea rows on xl
5. [x] Test responsive behavior: mobile, tablet, desktop (xl)
6. [x] Verify other routes (History, Charts, Settings) still layout correctly

## Success Criteria

- On large screens (≥1280px), Metrics and Build Summary appear side-by-side
- Components are more compact and don't stretch excessively
- WeeklyTicker remains full-width below the two-column section
- Layout remains responsive on mobile and tablet (vertical stack)
- No regression on History, Charts, or Settings pages
- Follows style guide patterns (theme variables, consistent spacing)
