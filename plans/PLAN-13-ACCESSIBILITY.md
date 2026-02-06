# Plan 13: Accessibility

**Status: ✅ Complete**

## Problem

Improve accessibility for keyboard and screen reader users.

## Tasks

1. [ ] Audit with axe-core or Lighthouse
2. [ ] Ensure all interactive elements are focusable and have visible focus
3. [ ] Add aria-labels where needed (charts, icons)
4. [ ] Test with keyboard-only navigation
5. [ ] Color contrast check (WCAG AA)

## Success Criteria

- No critical axe violations
- Full keyboard navigation
- Charts have text alternatives

---

## Resolution

- Charts: role="img" aria-label on area chart and bar chart containers
- MetricsCard Copy button: aria-label
- ThemeToggle: aria-label, focus-visible ring
- Global focus-visible styles for button, a, [role="button"]
