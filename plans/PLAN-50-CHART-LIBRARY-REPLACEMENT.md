# Plan 50: Chart Library Replacement (Beautiful Charts)

**Status: ✅ Complete**  
**Priority: P2**  
**Effort: High**  
**Impact: High**

---

## Problem

Our current charts (Tremor/Recharts) are visually weak. They rely heavily on flat gray/black fills, lack contrast, and do not align with modern UI expectations—especially in dark mode. Feedback has described them as dated and visually unappealing.

Beyond aesthetics, Tremor introduces unnecessary abstraction and styling constraints that make it difficult to align charts with our design system.

---

## Decision

### ✅ Standardize on **shadcn/ui Chart Patterns (Recharts-based)**

Rather than introducing an entirely new chart ecosystem, we will standardize on chart implementations built using **shadcn/ui patterns**.

These patterns provide:

- Design-system consistency
- Tailwind-first styling
- Strong accessibility defaults
- Highly customizable composition
- Clean integration with our existing stack
- Modern visual styling out of the box

shadcn charts use **Recharts as a rendering layer**, but replace Tremor’s styling and layout constraints with composable, theme-aware UI primitives.

This allows us to dramatically improve aesthetics while minimizing migration risk.

---

## Why shadcn Over Other Chart Libraries

### Design System Alignment

shadcn is already part of our UI foundation. Choosing it:

- Keeps component architecture consistent
- Leverages our existing Tailwind tokens
- Reduces new dependency surface area
- Improves long-term maintainability

### Visual Quality

shadcn chart examples demonstrate:

- Gradient-based fills
- Strong typography hierarchy
- Accessible contrast
- Better legend and tooltip presentation
- Polished dark mode support

### Flexibility

Unlike Tremor, shadcn:

- Does not lock us into a styling abstraction
- Allows direct control of chart markup
- Encourages composability with Card, Tooltip, and Layout primitives
- Makes it easy to evolve visuals without replacing libraries again later

### Risk Reduction

Remaining on Recharts as the underlying engine:

- Minimizes data transformation changes
- Preserves existing chart behavior
- Reduces bundle volatility
- Keeps team familiarity intact

---

## Alternatives Considered

### Rosen Charts

Very strong visually and modern in architecture, but introduces a completely new charting system. Migration cost, ecosystem maturity, and long-term maintenance risk outweigh the benefits right now.

### Visx

Extremely flexible but requires full visual implementation from scratch. Higher design and engineering overhead.

### MUI X Charts

Production ready and visually solid but introduces a second design system that conflicts with our Tailwind + shadcn stack.

### Plotly / AG Charts

Feature-rich but heavy and geared toward analytics dashboards rather than product UI.

---

## Current Stack

- `@tremor/react` (wraps Recharts)
- `ChartsContent.tsx`
  - Area charts (PRs & Linear)
  - Bar charts (Repos)
- `AnnualChartsContent.tsx`
  - Monthly area chart
- Dark theme via wrapper class
- Lazy-loaded chart chunks

---

## Target Architecture

Charts will be rebuilt using:

- shadcn chart composition patterns
- Recharts rendering primitives
- Tailwind design tokens
- Existing theme variables
- Shared UI container components

---

## Tasks

### 1. Spike

- Install shadcn chart examples
- Build:
  - One area chart
  - One bar chart
- Validate:
  - Theme token usage
  - Dark mode rendering
  - Accessibility behavior

---

### 2. Visual Standardization

- Implement gradient fills
- Improve tooltip design
- Standardize legends and axis labels
- Align typography with UI Card components

---

### 3. Replace Existing Charts

#### `ChartsContent.tsx`

- Replace Tremor AreaChart with shadcn area chart
- Replace Tremor BarChart with shadcn bar chart
- Maintain existing data mapping

#### `AnnualChartsContent.tsx`

- Replace Tremor monthly area chart
- Match layout and responsive behavior

---

### 4. Remove Tremor

- Uninstall `@tremor/react`
- Remove Tremor-specific Tailwind config
- Clean up unused theme overrides

---

### 5. Testing

- Update E2E chart specs
- Validate accessibility labels
- Verify CSV export compatibility
- Confirm responsive behavior across breakpoints

---

### 6. Documentation

- Document chart composition patterns
- Add reusable chart container examples
- Update README with chart standards

---

## Success Criteria

- Charts visually align with the rest of the product UI
- Dark mode is intentional and polished
- Gradients and typography improve readability
- Bundle size remains stable or decreases
- All dashboards migrate successfully
- Accessibility and export functionality remain intact
- Tremor is fully removed from the codebase
