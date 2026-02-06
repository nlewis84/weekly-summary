# Plan 43: Respect System Dark Mode on First Visit

**Status: ✅ Complete** · **Priority: P2** · **Effort: Low** · **Impact: Low**

## Problem

Theme defaults to "system" but there's a flash of wrong theme before `localStorage` is read and theme is applied. Users with `prefers-color-scheme: dark` may see a brief light flash.

## Tasks

1. [x] Add inline script in `root.tsx` or `entry.client.tsx` that runs before React: read `prefers-color-scheme` and set `document.documentElement.classList` immediately
2. [x] Prevents FOUC (flash of unstyled content) for theme
3. [x] Keep existing Settings theme picker; this only affects initial load before hydration
4. [x] Optional: also set `color-scheme` CSS property early

## Resolution

Already implemented in `app/root.tsx`: inline script in `<head>` reads `weekly-summary-theme` from localStorage, defaults to "system", and applies dark/light based on `matchMedia("(prefers-color-scheme: dark)")` before body renders.

## Success Criteria

- No theme flash on first load
- System preference respected before React hydrates
- Settings override still works after load
