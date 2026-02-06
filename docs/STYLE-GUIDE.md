# Style Guide

Use theme variables for all colors so dark/light mode works correctly. Never use hardcoded Tailwind colors (`text-gray-*`, `bg-gray-*`, `text-red-*`, `text-green-*`) in UI components.

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
| Labels | `text-sm text-(--color-text-muted)` | Metric labels, form labels |
| Values | `text-base font-semibold` or `text-lg font-semibold` | Metric values |
| Hints, secondary | `text-xs text-(--color-text-muted)` | Repos list, timestamps |

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
| Cards, surfaces | `--color-surface` | `bg-(--color-surface)` |
| Hover, elevated | `--color-surface-elevated` | `hover:bg-(--color-surface-elevated)` |
| Primary text | `--color-text` | `text-(--color-text)` |
| Secondary text | `text-(--color-text-muted)` | Labels, hints |
| Borders | `--color-border` | `border-(--color-border)` |
| Error states | `--color-error-bg`, `--color-error-border`, `--color-error-500` | Error banners |
| Success states | `--color-success-bg`, `--color-success-border`, `--color-success-500` | Success messages |
| Skeuomorphic shadows | `--shadow-skeuo-card`, `--shadow-skeuo-inset`, etc. | Cards, buttons |

## Patterns

- **Surface/card**: `bg-(--color-surface) border border-(--color-border) rounded-xl shadow-(--shadow-skeuo-card)`
- **Text**: `text-(--color-text)` or `text-(--color-text-muted)`
- **Error banner**: `bg-(--color-error-bg) border-(--color-error-border) text-(--color-error-500)`
- **Success**: `bg-(--color-success-bg) border-(--color-success-border) text-(--color-success-500)`
- **Primary accent**: `text-primary-500`, `hover:text-primary-500` (Tailwind primary palette)

## Avoid

- `text-gray-900`, `text-gray-600`, `bg-gray-50`, `bg-gray-100`, `border-gray-200`
- `text-red-400`, `bg-red-500/20`, `text-green-400`
