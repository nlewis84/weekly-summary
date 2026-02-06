# Plan 20: Keyboard Shortcuts Help

**Status: ✅ Complete** · **Priority: P0** · **Effort: Low** · **Impact: Medium**

## Problem

Plan 05 added `r` for refresh, but users may not discover it. A `?` shortcut to show available shortcuts would improve discoverability.

## Tasks

1. [x] Add `?` key handler to open shortcuts modal/panel
2. [x] List all shortcuts: `r` refresh, `?` help, `b` build (if applicable)
3. [x] Modal is dismissible (Escape, click outside)
4. [ ] Optional: add shortcut hint in footer or near Refresh button

## Success Criteria

- `?` opens a help modal with keyboard shortcuts
- Modal is accessible and easy to close

---

## Resolution

- ShortcutsHelp component: `?` opens modal, `Esc` or click outside closes
- Shortcuts: r refresh, ? help, b scroll to Build Summary (or navigate to /#build-summary)
