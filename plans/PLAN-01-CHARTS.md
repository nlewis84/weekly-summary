# Plan 01: Charts Overhaul

**Status: ✅ Complete**

## Problem

Charts look terrible. Current stack uses Recharts (or similar) with basic LineChart/BarChart. Need something fancier and more modern that works well with React 19 + Tailwind + dark theme.

## Current State

- `app/routes/charts.tsx` – LineChart (PRs & Linear metrics), BarChart (repos)
- `lib/charts-data.ts` – Fetches summaries from GitHub, builds data points
- Recharts may not be in package.json (verify dependency)

## Options (React-compatible, modern)

| Library | Pros | Cons |
|---------|------|------|
| **Nivo** | Beautiful defaults, great dark theme, composable | Slightly larger bundle |
| **visx** (Airbnb) | Low-level, max control, small | More code to write |
| **Tremor** | Tailwind-native, modern, simple API | Newer, fewer chart types |
| **Apache ECharts** | Very flexible, canvas/SVG, handles large data | Heavier |
| **React ApexCharts** | Rich interactivity, good docs | Different styling approach |

## Recommendation

**Tremor** – Tailwind-native, fits the existing design system, modern look, minimal config. Fallback: **Nivo** if Tremor lacks needed chart types.

## Tasks

1. [ ] Add chosen chart library to `package.json`
2. [ ] Replace LineChart with new library (PRs merged, reviews, Linear completed/worked on)
3. [ ] Replace BarChart with new library (repos per week)
4. [ ] Apply dark theme styling consistent with app
5. [ ] Add responsive behavior and better tooltips
6. [ ] Remove Recharts if present
7. [ ] Verify build and charts page load

## Success Criteria

- Charts look modern and polished
- Dark theme matches app
- Responsive on mobile
- No regressions in data display

---

## Resolution

- Replaced Recharts with **@tremor/react** (Tailwind-native)
- AreaChart for PRs & Linear metrics (stacked area, animated)
- BarChart for repos (vertical layout)
- Added Tremor content path and dark-tremor theme to tailwind.config
- darkMode: "class" for html.dark compatibility
