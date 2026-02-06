# Plan 14: Dark Mode Toggle

**Status: ✅ Complete**

## Problem

App uses dark theme by default. Add user preference for light/dark/system.

## Tasks

1. [ ] Add theme toggle (light / dark / system) in header
2. [ ] Persist preference (localStorage)
3. [ ] Apply class to html (dark/light) for Tailwind
4. [ ] Ensure charts and Tremor respect theme
5. [ ] System preference via prefers-color-scheme

## Success Criteria

- User can switch themes
- Preference persists across sessions
- All components render correctly in both modes

---

## Resolution

- ThemeToggle component: cycles dark → light → system, persists to localStorage
- Inline script in head: prevents flash, applies theme before paint
- Light mode CSS variable overrides in tailwind.css
- Header and nav use theme variables for both modes
