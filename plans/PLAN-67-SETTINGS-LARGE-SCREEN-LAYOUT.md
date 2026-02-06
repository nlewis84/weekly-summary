# Plan 67: Settings Page Large-Screen Layout

**Status:** ✅ Executed · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** On large screens, the Settings page content stretches edge-to-edge, making the four cards (Appearance, Auto-refresh, Weekly goals, Server settings) overly wide. This plan restacks content and uses a side-by-side layout to better utilize horizontal space on desktop, mirroring the approach from Plan 61 (Main Page Large-Screen Layout).

## Problem

The Settings page (`/settings`) has no layout optimization for large monitors:

- **Four cards** – Appearance, Auto-refresh, Weekly goals, and Server settings all stack vertically at full viewport width
- **Wasted horizontal space** – On wide screens, each card becomes very wide; form controls and text stretch unnecessarily
- **Layout** – Simple `space-y-6` vertical stack with no responsive grid for large screens

**Root cause:** `app/routes/settings.tsx` uses a simple vertical stack with no responsive layout for xl breakpoint.

## Affected Files

| File | Role |
|------|------|
| `app/routes/settings.tsx` | Settings page layout – add two-column grid on xl; make cards more compact |

## Solution Approach

### Two-Column Grid on Large Screens (xl: 1280px+)

1. **Restack content**: On `xl` breakpoint, create a two-column grid:
   - **Left column**: Appearance + Auto-refresh (UI preferences)
   - **Right column**: Weekly goals + Server settings (goals and config)
   - Both columns use equal width (`1fr 1fr`) or slight bias if desired

2. **Make cards more compact**:
   - Reduce padding on xl: `p-6` → `p-5 xl:p-4` (or `p-6 xl:p-5`)
   - Reduce vertical gap between cards: `space-y-6` → `gap-6 xl:gap-5`
   - Weekly goals grid: already `sm:grid-cols-3`; consider `xl:gap-3` for tighter spacing

3. **Responsive behavior**:
   - Mobile/tablet: Keep current vertical stack
   - Large screens (xl): Two-column layout
   - Use Tailwind breakpoint: `xl:` (1280px)

## Implementation Details

### `app/routes/settings.tsx`

Wrap the four cards in a responsive grid:

```tsx
<div className="space-y-6">
  <h2 className="text-lg font-semibold text-(--color-text)">Settings</h2>

  {/* Two-column layout on xl */}
  <div className="xl:grid xl:grid-cols-2 xl:gap-6 xl:items-start space-y-6 xl:space-y-0">
    {/* Left column: Appearance + Auto-refresh */}
    <div className="space-y-6">
      <div className="bg-surface rounded-xl ... p-6 xl:p-5">
        <h3>Appearance</h3>
        ...
      </div>
      <div className="bg-surface rounded-xl ... p-6 xl:p-5">
        <h3>Auto-refresh</h3>
        ...
      </div>
    </div>

    {/* Right column: Weekly goals + Server settings */}
    <div className="space-y-6">
      <div className="bg-surface rounded-xl ... p-6 xl:p-5">
        <h3>Weekly goals</h3>
        ...
      </div>
      <div className="bg-surface rounded-xl ... p-6 xl:p-5">
        <h3>Server settings</h3>
        ...
      </div>
    </div>
  </div>

  <Link to="/" ...>← Back to home</Link>
</div>
```

**Alternative – 2×2 grid:** If equal visual weight is preferred, use `xl:grid-cols-2` with all four cards as direct children in a single grid. Order: Appearance, Auto-refresh, Weekly goals, Server settings (fills left-to-right, top-to-bottom).

### Card Padding

- Base: `p-6`
- xl: `xl:p-5` (slightly more compact, consistent with Plan 61 MetricsCard `xl:p-5`)

### Weekly Goals Grid

- Current: `grid-cols-1 sm:grid-cols-3 gap-4`
- Optional: `gap-4 xl:gap-3` for tighter spacing on large screens

## Tasks

1. [x] Update `app/routes/settings.tsx` to add two-column grid layout on xl breakpoint
2. [x] Group cards: Left (Appearance, Auto-refresh), Right (Weekly goals, Server settings)
3. [x] Make cards more compact: reduce padding on xl (`p-6 xl:p-5`)
4. [x] Test responsive behavior: mobile, tablet, desktop (xl)
5. [x] Verify Back link and page header remain correctly positioned

## Success Criteria

- On large screens (≥1280px), settings cards appear in a two-column layout
- Cards are more compact and don't stretch excessively
- Layout remains responsive on mobile and tablet (vertical stack)
- No regression in card styling (shadows, borders, theme variables)
- Follows patterns from Plan 61 (main page layout)
