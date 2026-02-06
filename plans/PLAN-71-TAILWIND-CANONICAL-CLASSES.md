# Plan 71: Tailwind Canonical Classes

**Status: ✅ Executed** · **Priority: P3** · **Effort: Small** · **Impact: Low (code quality)**

**Created Feb 2026:** Replace verbose Tailwind arbitrary value classes (`bg-[var(--color-surface)]`, etc.) with canonical theme classes (`bg-surface`, etc.) per tailwindcss-intellisense suggestions.

## Problem

The tailwindcss-intellisense extension reports ~150+ suggestions across the codebase: classes using `[var(--...)]` or `(--...)` syntax can be written as shorter canonical forms. These are severity 4 (hints), not errors, but adopting them improves consistency and readability.

## Replacement Patterns

| Current | Canonical |
|---------|-----------|
| `bg-[var(--color-surface)]` | `bg-surface` |
| `bg-(--color-surface)` | `bg-surface` |
| `bg-[var(--color-surface-elevated)]` | `bg-surface-elevated` |
| `bg-(--color-surface-elevated)` | `bg-surface-elevated` |
| `bg-[var(--color-surface-elevated)]/60` | `bg-surface-elevated/60` |
| `bg-(--color-surface-elevated)/60` | `bg-surface-elevated/60` |
| `border-[var(--color-border)]` | `border-(--color-border)` |
| `border-(--color-border)` | *(no change; some files already use this)* |
| `text-[var(--color-text)]` | `text-(--color-text)` |
| `text-(--color-text)` | *(no shorter form suggested)* |
| `text-[var(--color-text-muted)]` | `text-text-muted` |
| `text-(--color-text-muted)` | `text-text-muted` |
| `shadow-[var(--shadow-skeuo-card)]` | `shadow-(--shadow-skeuo-card)` |
| `shadow-[var(--shadow-skeuo-inset)]` | `shadow-(--shadow-skeuo-inset)` |
| `shadow-[var(--shadow-skeuo-button)]` | `shadow-(--shadow-skeuo-button)` |
| `shadow-[var(--shadow-skeuo-button-hover)]` | `shadow-(--shadow-skeuo-button-hover)` |
| `shadow-[var(--shadow-skeuo-card-hover)]` | `shadow-(--shadow-skeuo-card-hover)` |
| `fill-[var(--color-text-muted)]` | `fill-text-muted` |
| `bg-[var(--color-success-bg)]` | `bg-success-bg` |
| `border-[var(--color-success-border)]` | `border-success-border` |
| `text-[var(--color-success-500)]` | `text-success-500` |
| `bg-(--color-error-bg)` | `bg-error-bg` |
| `border-(--color-error-border)` | `border-error-border` |
| `text-(--color-error-500)` | `text-error-500` |
| `min-w-[8rem]` | `min-w-32` |
| `placeholder:text-(--color-text-muted)` | `placeholder:text-text-muted` |

**Note:** For `border` and `text` with `--color-*`, the linter sometimes suggests `border-(--color-border)` or `text-(--color-text)` (parenthesis form) rather than a semantic shorthand. Use the exact suggestion from the linter when in doubt.

## Affected Files (by area)

### Components (app/components/)

| File | Issue count | Notes |
|------|-------------|-------|
| `AnnualChartsContent.tsx` | 3 | bg, border, text |
| `AnnualChartsSection.tsx` | 32 | Many bg/border/text patterns |
| `ChartsContent.tsx` | 24 | Cards, shadows, text |
| `FullSummaryForm.tsx` | 18 | Form card, inputs, buttons, success |
| `MetricsCard.tsx` | 18 | Cards, shadows, text |
| `RefreshButton.tsx` | 1 | hover:bg |
| `ShortcutsHelp.tsx` | 5 | bg, text |
| `TodaySection.tsx` | 1 | text |
| `WeeklyTicker.tsx` | 9 | bg, text, hover |
| `WeeklyTickerSkeleton.tsx` | 9 | bg, border |
| `ui/chart.tsx` | 1 | min-w-32 |

### Routes (app/routes/)

| File | Issue count | Notes |
|------|-------------|-------|
| `_index.tsx` | 2 | bg, text |
| `charts.tsx` | 14 | Error states, surface, text |
| `history._index.tsx` | 12 | bg, text, placeholder |
| `history.$week.tsx` | 14 | Cards, shadows, text |
| `history.compare.tsx` | 28 | Many cards and text |
| `settings.tsx` | 18 | Surface, text |

### Root & Layout

| File | Issue count | Notes |
|------|-------------|-------|
| `app/root.tsx` | 16 | Error states, surface, nav |

### Plans (optional)

| File | Issue count | Notes |
|------|-------------|-------|
| `plans/PLAN-57-TODAY-YESTERDAY-BUTTONS.md` | 4 | Code snippets in docs |
| `plans/PLAN-64-CARD-CONSISTENCY.md` | 1 | Code snippet |
| `plans/PLAN-67-SETTINGS-LARGE-SCREEN-LAYOUT.md` | 5 | Code snippets |

### Style Guide

| File | Changes |
|------|---------|
| `docs/STYLE-GUIDE.md` | Add canonical classes section; update Color Tokens, Patterns, Typography, and Avoid list |

**Note:** Plan markdown files contain example code. Updating them is optional and keeps docs consistent with implementation.

## Tasks

### Phase 0: Style Guide (do first)

Update `docs/STYLE-GUIDE.md` so new code uses canonical classes by default:

- [x] **Add "Tailwind Canonical Classes" section** – Prefer short theme classes (`bg-surface`, `text-text-muted`) over verbose forms (`bg-[var(--color-surface)]`, `text-(--color-text-muted)`). Reference tailwindcss-intellisense `suggestCanonicalClasses` hints.
- [x] **Update Color Tokens table** – Replace `bg-(--color-surface)` with `bg-surface`, `text-(--color-text-muted)` with `text-text-muted`, etc. Use canonical forms in all examples.
- [x] **Update Patterns section** – Use canonical classes in the surface/card, text, error, and success patterns.
- [x] **Update Typography table** – Change `text-(--color-text-muted)` to `text-text-muted`.
- [x] **Update Card Header Divider Pattern** – Use `border-(--color-border)` (canonical form per linter; no shorter shorthand).
- [x] **Add to Avoid list** – `bg-[var(--color-surface)]`, `text-[var(--color-text-muted)]`, and other verbose `[var(--...)]` forms.

### Phase 1: Components (highest churn)

- [x] **AnnualChartsContent.tsx** – 3 replacements
- [x] **AnnualChartsSection.tsx** – 32 replacements
- [x] **ChartsContent.tsx** – 24 replacements
- [x] **FullSummaryForm.tsx** – 18 replacements
- [x] **MetricsCard.tsx** – 18 replacements
- [x] **RefreshButton.tsx** – 1 replacement
- [x] **ShortcutsHelp.tsx** – 5 replacements
- [x] **TodaySection.tsx** – 1 replacement
- [x] **WeeklyTicker.tsx** – 9 replacements
- [x] **WeeklyTickerSkeleton.tsx** – 9 replacements
- [x] **ui/chart.tsx** – 1 replacement (`min-w-[8rem]` → `min-w-32`)

### Phase 2: Routes

- [x] **root.tsx** – 16 replacements
- [x] **_index.tsx** – 2 replacements
- [x] **charts.tsx** – 14 replacements
- [x] **history._index.tsx** – 12 replacements
- [x] **history.$week.tsx** – 14 replacements
- [x] **history.compare.tsx** – 28 replacements
- [x] **settings.tsx** – 18 replacements

### Phase 3: Plans (optional)

- [x] **PLAN-57** – 4 replacements in code snippets
- [x] **PLAN-64** – 1 replacement
- [x] **PLAN-67** – 5 replacements

## Execution Strategy

1. **Style guide first:** Update `docs/STYLE-GUIDE.md` with canonical class conventions so future changes align with the guide.
2. **Per-file search & replace:** Use regex or multi-cursor to replace patterns within each file. Example patterns:
   - `bg-[var(--color-surface)]` → `bg-surface`
   - `bg-[var(--color-surface-elevated)]` → `bg-surface-elevated`
   - `border-[var(--color-border)]` → `border-(--color-border)`
   - `text-[var(--color-text-muted)]` → `text-text-muted`
   - etc.
3. **Verify:** Run `npm run build` and visually spot-check key pages (main, charts, history, settings).
4. **Lint:** Confirm tailwindcss-intellisense reports no remaining `suggestCanonicalClasses` hints for these patterns.

## Success Criteria

- Style guide documents canonical class preferences so new code follows them.
- All `suggestCanonicalClasses` hints from tailwindcss-intellisense are resolved in app code (components + routes + root).
- Build passes.
- No visual regressions on main, charts, history, and settings pages.
