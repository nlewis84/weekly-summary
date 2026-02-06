# Plan 04: Build Weekly Summary UX

**Status: ✅ Complete**

## Problem

"Build Weekly Summary" is buried in a collapsible `<details>` at the bottom of the page. It feels disconnected and hard to discover.

## Current State

- `FullSummaryForm` – Renders inside `<details>` with `<summary>Build Weekly Summary</summary>`
- Placed after Today and Weekly sections on index
- User must expand to see form (check-ins, today-only, Generate & Save)

## Options

### A. Move Up
- Place Build Summary section above Weekly, or between Today and Weekly
- Keep as collapsible but more visible

### B. Promote to Primary Action
- Add prominent "Build Summary" button in header or hero
- Opens modal/slide-over or scrolls to form
- Form stays on page but is easier to reach

### C. Dedicated Route
- `/build` or `/summary/build` – full-page form
- Header link "Build Summary" goes there
- Index stays focused on Today + Weekly metrics

### D. Inline Expansion
- Replace `<details>` with a card that expands on click
- Or: always-visible compact form (fewer fields) with "Expand for check-ins" option

## Recommendation

**B + A**: Add a header CTA "Build Summary" that scrolls to the form (or opens it). Move the form section higher (e.g. after Today, before Weekly). Keep collapsible for users who don’t need it every visit.

## Tasks

1. [ ] Add "Build Summary" or "Generate" link/button in header (next to History, Charts)
2. [ ] Move FullSummaryForm section higher in index layout (e.g. after TodaySection)
3. [ ] Implement scroll-to-form or expand-on-click when header CTA is used
4. [ ] Optionally: default-open on first visit, collapsed on return (localStorage)
5. [ ] Ensure form remains accessible and keyboard-friendly

## Success Criteria

- Build Summary is discoverable without scrolling
- Primary action (generate) is easy to find
- Layout still works on mobile

---

## Resolution

- Added "Build Summary" link in header (primary styling)
- Moved Build Summary section after Today, before Weekly
- Added `#build-summary` anchor; header link scrolls to form
- Details auto-opens when navigating with `#build-summary` hash
