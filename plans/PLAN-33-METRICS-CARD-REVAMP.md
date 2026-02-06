# Plan 33: Metrics Card Revamp

**Status: ✅ Complete** · **Priority: P2** · **Effort: Medium** · **Impact: High**

## Problem

The WeeklyTicker card (compact "This week" metrics) is functional but visually dense and lacks clear hierarchy. All metrics run together in a single line, making it harder to scan and less polished.

## Current State

- Single-row layout: "This week:" + PRs merged, PR reviews, Linear completed, Linear worked on, Repos
- Numbers in purple; trend badges inline
- No copy action; no visual grouping

## Tasks

1. [x] **Visual grouping** – Group GitHub metrics (PRs) vs Linear vs Repos with subtle dividers or sections
2. [x] **Layout** – Metric pills or compact grid instead of flat inline; improve scanability
3. [x] **Copy action** – Add copy button for standup paste (match MetricsCard)
4. [x] **Polish** – Refined spacing, per-metric icons, better responsive behavior
5. [x] **Update skeleton** – WeeklyTickerSkeleton to match new layout

## Success Criteria

- Clearer visual hierarchy; metrics easier to scan
- Copy-to-clipboard for standup
- Consistent with design system (theme variables, skeuo shadows)
- Skeleton matches layout
