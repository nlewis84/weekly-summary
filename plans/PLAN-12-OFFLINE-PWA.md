# Plan 12: Offline / PWA

**Status: ✅ Complete**

## Problem

Make the app usable when offline or on slow connections.

## Tasks

1. [ ] Add service worker for caching static assets
2. [ ] Consider: cache API responses for history/charts (stale-while-revalidate)
3. [ ] Add web app manifest (icons, theme)
4. [ ] Offline fallback page when no cache

## Success Criteria

- Static assets load from cache when offline
- Basic navigation works without network

---

## Resolution

- Added vite-plugin-pwa with VitePWA()
- registerType: autoUpdate
- Web app manifest (name, short_name, theme_color, background_color, display: standalone)
- Workbox precaches JS, CSS, HTML, icons
