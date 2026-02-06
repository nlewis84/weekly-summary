# Contributing

## Development

```bash
pnpm install
pnpm dev
```

## PR Checklist

Before opening a PR:

- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run lint` passes
- [ ] `pnpm run test` passes
- [ ] **Style guide**: Use theme variables for colors—no `text-gray-*`, `bg-gray-*`, `text-red-*`, `text-green-*` in UI. See [docs/STYLE-GUIDE.md](docs/STYLE-GUIDE.md)

## Style Guide

Use theme variables for all colors so dark/light mode works correctly. See [docs/STYLE-GUIDE.md](docs/STYLE-GUIDE.md) for token usage and patterns. ESLint will warn on hardcoded colors in `app/`.
