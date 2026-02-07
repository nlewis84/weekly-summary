# Plan 75: Theme Toggle in Settings Only

**Status: Draft**

**Priority: P2**

Move the light/dark mode control exclusively to Settings. Remove the ThemeToggle button from the header.

## Problem

The header currently shows a ThemeToggle button that cycles dark → light → system. The Settings page already has a full "Appearance" card with theme options (Dark, Light, System) as radio cards. Having both creates redundancy and adds visual clutter to the header. Theme preference is a settings concern, not a primary navigation action.

## Current State

- **Header** (`app/root.tsx`): `ThemeToggle` component between logo and Build Summary link
- **ThemeToggle** (`app/components/ThemeToggle.tsx`): Compact icon button that cycles themes; listens for `weekly-summary-theme-changed` so it stays in sync when Settings changes theme
- **Settings** (`app/routes/settings.tsx`): "Appearance" card with three radio options (Dark, Light, System); dispatches `weekly-summary-theme-changed` on change
- Theme persistence: `localStorage` key `weekly-summary-theme`; inline script in `root.tsx` head prevents flash

## Scope

### 1. Remove ThemeToggle from Header

| File | Changes |
|------|---------|
| `app/root.tsx` | Remove `ThemeToggle` import and the `<ThemeToggle />` from the header nav. Header nav order becomes: Build Summary, History, Charts, Settings. |

### 2. Delete ThemeToggle Component

| File | Changes |
|------|---------|
| `app/components/ThemeToggle.tsx` | Delete file. Theme control lives only in Settings. |

### 3. Simplify Settings (Optional)

| File | Changes |
|------|---------|
| `app/routes/settings.tsx` | Remove the `window.dispatchEvent("weekly-summary-theme-changed", ...)` call from `handleThemeChange`—no other component listens after ThemeToggle is removed. |

## Implementation Order

1. Remove `ThemeToggle` import and usage from `app/root.tsx`
2. Delete `app/components/ThemeToggle.tsx`
3. Remove `weekly-summary-theme-changed` dispatch from `app/routes/settings.tsx` (optional cleanup)

## Verification

- [ ] Header shows Build Summary, History, Charts, Settings (no theme icon)
- [ ] Theme can be changed only via Settings → Appearance
- [ ] Theme preference persists across sessions (localStorage)
- [ ] No flash on load; inline script still applies saved theme before paint
- [ ] Build succeeds
- [ ] No broken imports or references to ThemeToggle

## Dependencies

- **Plan 74** (Remove Build Summary Header Button): If Plan 74 is implemented first, its verification checklist says "Header shows ThemeToggle, History, Charts, Settings". Plan 74 would need to be updated to remove ThemeToggle from that list. This plan (75) can be done independently; Plan 74 is simply a different header change.

## Notes

- Plan 14 (Dark Mode Toggle) added the header ThemeToggle. This plan consolidates theme control in Settings per Plan 16 (Settings Page resolution: "ThemeToggle syncs via mirror from settings").
- Plan 66 (Cursor Affordances) references ThemeToggle; that plan's checklist can be updated to remove the ThemeToggle row once this plan is complete.
- Plan 13 (Accessibility): Settings theme cards use proper labels and focus; no regression.
