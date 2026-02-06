# Style Guide

Use theme variables for all colors so dark/light mode works correctly. Never use hardcoded Tailwind colors (`text-gray-*`, `bg-gray-*`, `text-red-*`, `text-green-*`) in UI components.

## Color Tokens

| Use case | Token | Example |
|----------|-------|---------|
| Cards, surfaces | `--color-surface` | `bg-[var(--color-surface)]` |
| Hover, elevated | `--color-surface-elevated` | `hover:bg-[var(--color-surface-elevated)]` |
| Primary text | `--color-text` | `text-[var(--color-text)]` |
| Secondary text | `text-[var(--color-text-muted)]` | Labels, hints |
| Borders | `--color-border` | `border-[var(--color-border)]` |
| Error states | `--color-error-bg`, `--color-error-border`, `--color-error-500` | Error banners |
| Success states | `--color-success-bg`, `--color-success-border`, `--color-success-500` | Success messages |
| Skeuomorphic shadows | `--shadow-skeuo-card`, `--shadow-skeuo-inset`, etc. | Cards, buttons |

## Patterns

- **Surface/card**: `bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-[var(--shadow-skeuo-card)]`
- **Text**: `text-[var(--color-text)]` or `text-[var(--color-text-muted)]`
- **Error banner**: `bg-[var(--color-error-bg)] border-[var(--color-error-border)] text-[var(--color-error-500)]`
- **Success**: `bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success-500)]`
- **Primary accent**: `text-primary-500`, `hover:text-primary-500` (Tailwind primary palette)

## Avoid

- `text-gray-900`, `text-gray-600`, `bg-gray-50`, `bg-gray-100`, `border-gray-200`
- `text-red-400`, `bg-red-500/20`, `text-green-400`
