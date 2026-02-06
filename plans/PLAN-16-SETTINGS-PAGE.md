# Plan 16: Settings Page

**Status: ✅ Complete** · **Priority: P2** · **Effort: Low** · **Impact: Medium**

## Problem

User preferences (theme, GitHub paths, etc.) are scattered. A central settings page would improve discoverability and future extensibility.

## Tasks

1. [x] Add `/settings` route
2. [x] Move theme preference to settings (or mirror from ThemeToggle)
3. [x] Document which settings are client-only vs require env (server)
4. [ ] Optional: localStorage-backed preferences (e.g. default check-in template, refresh interval)
5. [x] Link to settings from nav or header

## Success Criteria

- Settings page exists and is reachable from nav
- Theme and other client prefs can be managed in one place

---

## Resolution

- `/settings` route with theme selector (Dark, Light, System)
- ThemeToggle syncs via custom event when settings changes theme
- Server settings note: env vars documented as not editable in-app
