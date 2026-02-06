# Plan 50: Chart Library Replacement (Beautiful Charts)

**Status: 🔲 Pending** · **Priority: P2** · **Effort: High** · **Impact: High**

## Problem

Current charts (Tremor/Recharts) are visually poor: flat gray/black areas, minimal contrast, no gradients or polish. They look dated and unappealing in dark mode. Users have called them "absolutely terrible" and "not beautiful."

## Research: Favored Chart Libraries (2024–2025)

Web search for "best React chart library 2024 2025 beautiful aesthetic" and "most beautiful JavaScript charting library 2024" surfaced these as top choices:

### 1. **Rosen Charts** (rosencharts.com) — **Recommended**

- **Tagline**: "The next generation of charting"
- **Highlights**: First fully RSC-compatible React chart library; copy-pasteable examples; automatic dark mode; built on D3 + HTML/SVG; Tailwind/Shadcn/Next.js/Remix compatible
- **Aesthetics**: Gradient effects, pattern-based designs, stunning area/bar/line examples; direct access to divs/SVGs for pixel-perfect control
- **Bundle**: Reduces bundle size vs Recharts; D3 as only dependency
- **License**: MIT, open-source (675+ GitHub stars)
- **Chart types**: Area (stacked, gradient, outlined), bar (horizontal, vertical, gradient), line, pie, donut, scatter, heatmap, treemap, funnel, radar
- **Fit**: Matches our stack (React Router, Tailwind, dark mode); area + bar charts available; beautiful by default

### 2. **MUI X Charts** (mui.com/x/react-charts)

- **Highlights**: Production-ready; D3 + SVG; Material UI integration; extensive customization
- **Aesthetics**: Beautiful defaults; open-core (MIT Community)
- **Chart types**: Bar, line, pie, scatter, gauge, radar, heatmap, funnel
- **Fit**: Heavier if we don't use MUI; would add new design system

### 3. **Visx** (airbnb.io/visx)

- **Highlights**: Low-level primitives from Airbnb; D3 + React; un-opinionated; modular (install only what you need)
- **Aesthetics**: You build the look; no default "beautiful" theme—requires design work
- **Fit**: Maximum flexibility but more implementation effort; not "beautiful out of the box"

### 4. **Plotly.js** (plotly.com/javascript)

- **Highlights**: 40+ chart types; 3D; declarative JSON config; D3 + stack.gl
- **Aesthetics**: Sophisticated, highly customizable
- **Fit**: Heavier; more suited to scientific/analytics dashboards

### 5. **Chart.js** (chartjs.org)

- **Highlights**: Simple API; 8 chart types; responsive; animations; v4 tree-shaking
- **Aesthetics**: Clean but generic; not standout "beautiful"
- **Fit**: Lighter than Recharts but still basic look

### 6. **AG Charts** (ag-grid.com/charts)

- **Highlights**: Canvas-based; 25+ types; enterprise-grade; React/Angular/Vue
- **Fit**: Enterprise focus; likely heavier and paid for advanced features

## Recommendation

**Rosen Charts** is the best fit: modern, beautiful by default, dark mode native, Tailwind-compatible, and lighter than Tremor/Recharts. Copy-pasteable area and bar examples match our use cases.

**Fallback**: Visx if we want full control and are willing to design from scratch; MUI X if we adopt Material.

## Current Stack

- `@tremor/react` (uses Recharts under the hood)
- `ChartsContent.tsx`: AreaChart (PRs & Linear), BarChart (Repos)
- `AnnualChartsContent.tsx`: AreaChart (monthly)
- Dark theme via `className="dark"` wrapper
- Lazy-loaded for chunk size

## Tasks

1. [ ] **Spike**: Install Rosen Charts; build one area chart and one bar chart with our data; verify dark mode and theme variables
2. [ ] **Evaluate**: Compare bundle size (Tremor+Recharts vs Rosen+D3); ensure < or ≈ current chunk
3. [ ] **Replace**: Swap `ChartsContent.tsx` to use Rosen area + bar charts; match our color palette (primary-500, etc.)
4. [ ] **Replace**: Swap `AnnualChartsContent.tsx` to Rosen area chart
5. [ ] **Polish**: Apply gradients, better legend, improved axis labels per Rosen examples
6. [ ] **Remove**: Uninstall `@tremor/react`; remove Tremor from `tailwind.config.js` content
7. [ ] **Test**: E2E charts spec; verify Export CSV still works
8. [ ] **Document**: Add chart library choice to README or docs

## Success Criteria

- Charts are visually striking: gradients, clear contrast, polished typography
- Dark mode looks intentional, not muddy
- Bundle size does not increase significantly
- Area chart (PRs & Linear) and bar chart (Repos) both migrated
- Annual dashboard chart migrated
- All existing functionality (Export CSV, aria-labels) preserved
