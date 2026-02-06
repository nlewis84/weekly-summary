# Plan 06: Root Layout & Navigation

**Status: 🔲 Pending**

## Problem

Improve overall layout and navigation for consistency and discoverability.

## Current State

- `app/root.tsx` – Header with title, nav links (History, Charts)
- Dark theme, max-w-3xl main content
- No breadcrumbs, no active state on nav links

## Tasks

1. [ ] Add active state to nav links (e.g. underline or color when on History/Charts)
2. [ ] Consider breadcrumbs on History week detail (Home > History > Week 2026-01-31)
3. [ ] Ensure header is sticky on scroll (optional)
4. [ ] Add skip-to-content link for accessibility
5. [ ] Align header styling with rest of app (skeuo shadows, etc.)

## Success Criteria

- Users can tell which section they’re in
- Navigation is accessible and consistent
