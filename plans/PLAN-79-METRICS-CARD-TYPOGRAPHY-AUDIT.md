# Plan 79: Metrics Card Typography Audit

**Status:** Draft · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** Audit the Metrics card and align its typography and styling with `docs/STYLE-GUIDE.md` rules. This plan focuses on typography, sizing, and theme token usage.

## Problem

The Metrics card may have drifted from the style guide. A systematic audit is needed to ensure:

- Typography sizes match the defined hierarchy (card titles, labels, values, hints)
- Colors use theme variables instead of hardcoded Tailwind colors
- Spacing follows the scale (p-4, p-5, gap-4, etc.)
- Repo list overflow behavior matches the spec
- Canonical Tailwind classes are used where applicable

## Style Guide Reference (Typography)

| Element | Class | Example |
|---------|-------|---------|
| Card titles | `text-lg font-semibold` | Metrics, Build Weekly Summary |
| Compact card titles | `text-base font-semibold` | This week |
| Labels | `text-sm text-text-muted` | Metric labels, form labels |
| Values | `text-base font-semibold` or `text-lg font-semibold` | Metric values |
| Hints, secondary | `text-xs text-text-muted` | Repos list, timestamps |

**Repo List Overflow:** Allow natural wrap with consistent `line-height` and `text-sm`. Use `truncate` only when space is severely constrained.

## Audit Findings

### `app/components/MetricsCard.tsx`

| Location | Current | Style Guide | Status |
|----------|---------|-------------|--------|
| Card title (line 147) | `text-lg font-semibold text-(--color-text)` | Card titles: `text-lg font-semibold` | ✅ Compliant |
| Metric labels (line 179) | `text-sm text-text-muted` | Labels: `text-sm text-text-muted` | ✅ Compliant |
| Metric values (line 189) | `text-lg font-semibold text-primary-500` | Values: `text-base` or `text-lg font-semibold` | ✅ Compliant |
| Trend badge delta (line 195) | `text-xs` (no color) | Hints: `text-xs text-text-muted` | ⚠️ Add `text-text-muted` |
| Repos label (line 223) | `text-sm text-text-muted` | Labels: `text-sm text-text-muted` | ✅ Compliant |
| Repos list value (line 231) | `text-sm font-medium text-(--color-text)` | Repos list: `text-sm` per Repo List Overflow; Hints: `text-xs text-text-muted` | ⚠️ Clarify: style guide has "Repos list" under both hints (text-xs) and Repo List Overflow (text-sm). Recommend `text-sm` for readability; verify line-height |
| View details button (line 241) | `text-sm font-medium text-primary-500` | N/A | ✅ Acceptable |
| Details section headers (lines 262, 288, etc.) | `font-medium text-text-muted mb-2` | No explicit size (inherits) | ⚠️ Add `text-sm` for consistency with labels |
| PR/Linear links in details | `text-primary-500 hover:underline` | Primary accent | ✅ Compliant |

### Hardcoded Colors (Style Guide: "Never use hardcoded Tailwind colors")

| Location | Current | Fix |
|----------|---------|-----|
| TrendBadge positive (line 44) | `text-emerald-600 dark:text-emerald-400` | Use `text-success-500` |
| TrendBadge negative (line 51) | `text-amber-600 dark:text-amber-400` | Use theme token; if no "warning" token exists, consider `text-text-muted` or add semantic token |
| Goal met checkmark (line 211) | `text-emerald-600 dark:text-emerald-400` | Use `text-success-500` |
| Metric cell border when goal met (line 176) | `border-emerald-500/50` | Use `border-success-border` or `border-success-500` |

### Canonical Classes (Style Guide: Prefer short theme classes)

| Location | Current | Canonical |
|----------|---------|-----------|
| Card title | `text-(--color-text)` | `text-text` (if available) or keep if no short form |
| Border | `border-(--color-border)` | Document whether `border-border` exists |

### Spacing

| Location | Current | Style Guide | Status |
|----------|---------|-------------|--------|
| Card padding | `p-5` | `p-5` for card content | ✅ Compliant |
| Grid gap | `gap-4` | `gap-4` for tight gaps | ✅ Compliant |
| Section margins | `mt-4 pt-4`, `space-y-4` | `mt-4`, `space-y-4` | ✅ Compliant |

### `app/components/MetricsCardSkeleton.tsx`

| Location | Current | Notes |
|----------|---------|-------|
| Card padding | `p-6` | MetricsCard uses `p-5`; skeleton should match to prevent layout shift |
| Header spacing | `mb-4` | MetricsCard uses `pb-4` on header; skeleton structure differs slightly |
| Grid | `sm:grid-cols-2` only | MetricsCard uses `xl:grid-cols-3`; skeleton may not match 3-col layout on xl |

## Affected Files

| File | Role |
|------|------|
| `app/components/MetricsCard.tsx` | Primary typography and color fixes |
| `app/components/MetricsCardSkeleton.tsx` | Match padding and grid layout to MetricsCard |

## Implementation Tasks

1. [ ] **Trend badge delta:** Add `text-text-muted` to the trend delta span (line 195)
2. [ ] **Details section headers:** Add `text-sm` to h3 elements (PRs merged, PR reviews, Linear completed, etc.)
3. [ ] **Repos list:** Verify `text-sm` and `line-height` per Repo List Overflow; remove `truncate` if present, prefer natural wrap
4. [ ] **TrendBadge colors:** Replace `text-emerald-600 dark:text-emerald-400` with `text-success-500`; replace `text-amber-600 dark:text-amber-400` with appropriate theme token (check `tailwind.css` for warning/amber equivalent or use `text-text-muted` for neutral)
5. [ ] **Goal met styling:** Replace `text-emerald-600 dark:text-emerald-400` with `text-success-500`; replace `border-emerald-500/50` with `border-success-border` or semantic equivalent
6. [ ] **Canonical classes:** If `text-text` and `border-border` exist in the theme, replace verbose forms
7. [ ] **MetricsCardSkeleton:** Align `p-6` → `p-5`; ensure grid matches MetricsCard (`xl:grid-cols-3`); align header/content structure

## Pre-Implementation Check

Before implementing, verify in `app/tailwind.css` and Tailwind config:

- Existence of `text-text`, `border-border`, `text-success-500`, `border-success-border`
- Whether a "warning" or "amber" semantic token exists for trend-down (or if `text-text-muted` is preferred)

## Success Criteria

- All Metrics card typography matches the style guide hierarchy
- No hardcoded `text-emerald-*`, `text-amber-*`, or similar in MetricsCard
- Repo list uses `text-sm` with natural wrap per Repo List Overflow
- MetricsCardSkeleton padding and grid match MetricsCard to prevent layout shift
- Dark/light mode renders correctly for all updated elements
