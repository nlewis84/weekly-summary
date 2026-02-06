# Plan 27: Charts Chunk Size Reduction

**Status: ✅ Complete** · **Priority: P3** · **Effort: Medium** · **Impact: Medium**

## Problem

Charts route bundle is ~843 KB (Tremor + Recharts). Users who never visit Charts pay the cost if not code-split. Build already warns about chunk size.

## Tasks

1. [ ] Verify Charts route is lazy-loaded (dynamic import)
2. [ ] Evaluate lighter chart lib (e.g. Chart.js, uPlot) for area/bar charts
3. [ ] Tree-shake Tremor: import only used components
4. [ ] Optional: replace Lottie with CSS/SVG animation for lighter bundle
5. [ ] Target: Charts chunk &lt;300 KB

## Success Criteria

- Charts chunk size reduced by &gt;40%
- No regression in chart functionality or theme support
