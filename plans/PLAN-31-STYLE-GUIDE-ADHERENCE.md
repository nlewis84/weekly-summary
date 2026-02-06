# Plan 31: Style Guide Adherence

**Status: ✅ Complete** · **Priority: P2** · **Effort: Medium** · **Impact: High**

## Problem

The app has a design system (CSS variables in `tailwind.css` for theme support) but many components use hardcoded Tailwind colors (`text-gray-900`, `bg-gray-50`, `text-red-400`, etc.) instead of theme variables. This causes:

- **Dark/light mode bugs**: Hardcoded grays don't adapt; `text-gray-900` is dark text on dark backgrounds in dark mode
- **Inconsistent theming**: Error/success states use `text-red-400` instead of `--color-error-*`; success uses `text-green-400` instead of `--color-success-*`
- **Maintenance burden**: No single source of truth; new components may copy wrong patterns

## Design System (Current)

Defined in `app/tailwind.css`:

| Token | Purpose |
|-------|---------|
| `--color-surface` | Cards, elevated surfaces |
| `--color-surface-elevated` | Hover states, modals |
| `--color-border` | Borders |
| `--color-text` | Primary text |
| `--color-text-muted` | Secondary text |
| `--color-error-bg`, `--color-error-border` | Error states |
| `--color-success-bg`, `--color-success-border` | Success states |
| `--shadow-skeuo-*` | Skeuomorphic shadows |

## Tasks

1. [x] Create `docs/STYLE-GUIDE.md` documenting:
   - Use `var(--color-*)` for all colors; never `text-gray-*`, `bg-gray-*`, `text-red-*`, `text-green-*` in UI
   - Surface/card pattern: `bg-[var(--color-surface)]` or `bg-[var(--color-surface-elevated)]`
   - Text: `text-[var(--color-text)]`, `text-[var(--color-text-muted)]`
   - Borders: `border-[var(--color-border)]`
   - Error: `bg-[var(--color-error-bg)] border-[var(--color-error-border)]` + semantic text color
   - Success: `bg-[var(--color-success-bg)] border-[var(--color-success-border)]`
   - Shadows: `shadow-[var(--shadow-skeuo-card)]` etc.
2. [x] Audit and fix components: replace hardcoded grays/reds/greens with theme variables
3. [x] Add Prettier (or enforce existing formatter) with config committed
4. [x] Add ESLint rule or plugin to flag `text-gray-`, `bg-gray-`, `text-red-`, `text-green-` in `app/` (or document as manual review)
5. [x] Add style guide to PR checklist / CONTRIBUTING

## Success Criteria

- All UI components use theme variables for colors
- Dark and light modes render correctly everywhere
- New code has clear guidance; lint/format catches common mistakes

---

## Resolution

- Created `docs/STYLE-GUIDE.md` with token usage rules
- Replaced hardcoded colors in root, ErrorBanner, FullSummaryForm, MetricsCard, MetricsCardSkeleton, RefreshButton, TodaySection, WeeklyTickerSkeleton, charts, history._index, history.$week
- Added Prettier with `.prettierrc` and `pnpm format` script
- Added ESLint rule `no-hardcoded-colors` in `eslint-rules/` (warns on `text-gray-*`, `bg-gray-*`, `text-red-*`, `text-green-*` in `app/`)
- Created `CONTRIBUTING.md` with PR checklist and style guide reference

## Affected Files (Audit)

- `app/root.tsx` – body `text-gray-900`, error boundary hardcoded colors
- `app/components/ErrorBanner.tsx` – `text-red-400`, `bg-red-500/20`
- `app/components/FullSummaryForm.tsx` – `bg-gray-50`, `text-gray-900`, `text-green-400`
- `app/components/MetricsCard.tsx` – `bg-gray-50`, `text-gray-900`, `text-gray-600`, etc.
- `app/components/MetricsCardSkeleton.tsx` – `bg-gray-50`, `bg-gray-200`
- `app/components/RefreshButton.tsx` – `hover:bg-gray-100`
- `app/components/TodaySection.tsx` – `text-gray-900`
- `app/components/WeeklyTickerSkeleton.tsx` – `bg-gray-50`, `bg-gray-200`
- `app/routes/charts.tsx` – error boundary `text-red-400`, `text-gray-400`
- `app/routes/history._index.tsx` – `bg-gray-50`, `text-gray-900`, `text-gray-500`
- `app/routes/history.$week.tsx` – `text-gray-600`, `text-gray-900`, `bg-gray-100`
