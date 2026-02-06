# Style Guide

Use theme variables for all colors so dark/light mode works correctly. Never use hardcoded Tailwind colors (`text-gray-*`, `bg-gray-*`, `text-red-*`, `text-green-*`) in UI components.

## Tailwind Canonical Classes

Prefer short theme classes (`bg-surface`, `text-text-muted`) over verbose forms (`bg-[var(--color-surface)]`, `text-(--color-text-muted)`). The tailwindcss-intellisense extension suggests canonical classes via `suggestCanonicalClasses` hints—adopt them for consistency and readability.

## Spacing Scale

Prefer Tailwind's spacing scale for consistency. Use `4`, `5`, `6` (1rem, 1.25rem, 1.5rem) for card and section spacing. Avoid arbitrary values unless necessary.

| Token | Value | Use |
|-------|-------|-----|
| `p-4`, `gap-4` | 1rem | Card padding, tight gaps |
| `p-5`, `pt-4`, `pb-5` | 1rem / 1.25rem | Card content padding |
| `mt-4`, `space-y-4` | 1rem | Between sections |
| `mt-5`, `space-y-5` | 1.25rem | Between major blocks |
| `mt-6`, `space-y-6` | 1.5rem | Page-level spacing |

## Typography

| Element | Class | Example |
|---------|-------|---------|
| Card titles | `text-lg font-semibold` | Metrics, Build Weekly Summary |
| Compact card titles | `text-base font-semibold` | This week |
| Labels | `text-sm text-text-muted` | Metric labels, form labels |
| Values | `text-base font-semibold` or `text-lg font-semibold` | Metric values |
| Hints, secondary | `text-xs text-text-muted` | Repos list, timestamps |

## Card Header Divider Pattern

Cards use a consistent header/content divider: the **content wrapper** owns the border and top padding, not the header.

```tsx
<div className="... p-5">
  <div className="... pb-4">{/* header, no border */}</div>
  <div className="pt-4 border-t border-(--color-border) ...">{/* content */}</div>
</div>
```

## Repo List Overflow

For repo lists (e.g. in Metrics or This week cards): allow natural wrap with consistent `line-height` and `text-sm`. Use `truncate` only when space is severely constrained; prefer wrapping for readability.

## Color Tokens

| Use case | Token | Example |
|----------|-------|---------|
| Cards, surfaces | `--color-surface` | `bg-surface` |
| Hover, elevated | `--color-surface-elevated` | `hover:bg-surface-elevated` |
| Primary text | `--color-text` | `text-(--color-text)` |
| Secondary text | `--color-text-muted` | `text-text-muted` |
| Borders | `--color-border` | `border-(--color-border)` |
| Error states | `--color-error-bg`, `--color-error-border`, `--color-error-500` | `bg-error-bg`, `border-error-border`, `text-error-500` |
| Success states | `--color-success-bg`, `--color-success-border`, `--color-success-500` | `bg-success-bg`, `border-success-border`, `text-success-500` |
| Skeuomorphic shadows | `--shadow-skeuo-card`, `--shadow-skeuo-inset`, etc. | `shadow-(--shadow-skeuo-card)`, `shadow-(--shadow-skeuo-inset)` |

## Patterns

- **Surface/card**: `bg-surface border border-(--color-border) rounded-xl shadow-(--shadow-skeuo-card)`
- **Text**: `text-(--color-text)` or `text-text-muted`
- **Error banner**: `bg-error-bg border-error-border text-error-500`
- **Success**: `bg-success-bg border-success-border text-success-500`
- **Primary accent**: `text-primary-500`, `hover:text-primary-500` (Tailwind primary palette)

## Avoid

- `text-gray-900`, `text-gray-600`, `bg-gray-50`, `bg-gray-100`, `border-gray-200`
- `text-red-400`, `bg-red-500/20`, `text-green-400`
- Verbose `[var(--...)]` forms: `bg-[var(--color-surface)]`, `text-[var(--color-text-muted)]`, `border-[var(--color-border)]`, etc. Use canonical classes instead (`bg-surface`, `text-text-muted`, `border-(--color-border)`).
