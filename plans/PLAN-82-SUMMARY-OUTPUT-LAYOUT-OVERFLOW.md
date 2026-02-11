# Plan 82: Summary Output Layout – Overflow and Data Presentation

**Status:** ✅ Executed · **Priority: P2** · **Effort: Medium** · **Impact: High**

**Created Feb 2026:** After a user generates a weekly summary, parts of the UI overflow their bounds and do not look good: the Check-ins text area can overflow vertically, and the Metrics card shows numbers floating outside their cards and labels truncated (e.g. "PRs created/u", "PR comment", "Commits pushed"). This plan addresses layout overflow and considers alternative ways to present the summary data.

**Screenshots (current state):**
- [Build Summary – Check-ins overflow](/Users/nlewis/.cursor/projects/Users-nlewis-Development-weekly-summary/assets/Screenshot_2026-02-11_at_2.25.34_PM-3792971e-d2ba-493f-8a06-fa2ff582588f.png): Check-ins content overflows the text area; scrollbar and cut-off text.
- [Metrics card – Numbers and labels overflow](/Users/nlewis/.cursor/projects/Users-nlewis-Development-weekly-summary/assets/Screenshot_2026-02-11_at_2.25.18_PM-a3df4584-7ac7-43d8-8b4d-fd2baf26751e.png): Metric values (3, 10, 1, 5, 0) sit outside card bounds; labels truncated.

## Problem

1. **Check-ins field:** Multi-line check-ins content overflows the visible text area; the last line is cut off and a scrollbar appears. The control does not constrain or present the content in a way that stays within bounds and looks intentional.
2. **Metrics card:** Numerical values are positioned to the right of their metric cards instead of inside them; labels are truncated ("PRs created/u", "PR comment", "Commits pushed"). The grid/card layout does not keep label + value together within a clear boundary, so the result looks messy and is harder to scan.

## Root Cause (Directional)

- **Check-ins:** Fixed or insufficient height on the textarea (or flex/grid not giving it a proper max-height or min-height), and/or no consideration for "display mode" after save (e.g. read-only block with max-height and scroll).
- **Metrics card:** Layout likely uses separate elements or flex/grid that allow the number to sit outside the card (e.g. label in one cell, value in another without proper containment), and label text has no truncation/ellipsis or wrapping strategy.

## Approaches

### A. Fix in place (constrain and align)

- **Check-ins:** Give the textarea a sensible `min-height` and `max-height` with `overflow-y: auto`; or after save, show check-ins in a read-only block with `max-height` and scroll so nothing spills out.
- **Metrics:** Restructure so each metric is a single card cell containing both icon + label + value; use `overflow-hidden` and `text-overflow: ellipsis` (or wrap with `word-break`) for long labels; ensure values are inside the card (e.g. flex with `flex-shrink-0` for the number).

### B. Different presentation for summary output

- **Check-ins:** After generation, show check-ins as a compact read-only section (e.g. list or cards) with a fixed max height and "Show more" if needed, instead of a large textarea.
- **Metrics:** Present metrics in a list or table layout (label | value per row) so nothing floats outside; or use a single-row horizontal scroll for metric chips (each chip = icon + short label + value) with clear boundaries.

### C. Hybrid

- **Check-ins:** Keep textarea for editing; fix height/overflow for both edit and post-save view (read-only block with scroll when not editing).
- **Metrics:** Keep card grid but fix layout so value is inside each card and labels use ellipsis or wrap; optionally add a "View details" expanded view (see Plan 73) that uses a different layout (e.g. list) for clarity.

## Recommendation

- **Metrics card (priority):** **Approach A + C.** Fix the Metrics card so every metric is one contained unit: icon + label + value inside the same card; truncate or wrap labels with `text-overflow: ellipsis` / `word-break` and a defined max width so "PRs created/updated", "PR comments", "Commits pushed" don’t overflow. Ensure the number is in the same flex/grid cell as the label (e.g. right-aligned in the card). Keep "View details" for expanded content (Plan 73).
- **Check-ins:** **Approach A for edit; A or B for post-save.** (1) In edit mode: set `max-height` and `overflow-y: auto` on the textarea so the field doesn’t grow unbounded. (2) Optionally, after save: show check-ins in a read-only block with `max-height` and scroll (or "Show more") so the summary output doesn’t overflow.

## Affected Files (Expected)

| File | Role |
|------|------|
| Metrics card component (e.g. `WeeklyTicker`, or Metrics card on index) | Restructure so value is inside card; add truncation/wrap for labels |
| FullSummaryForm (or Build Summary card) | Check-ins textarea: min/max height, overflow; optional read-only summary view |
| Any shared card/list styles | Ensure consistent overflow and alignment |

## Tasks

1. [x] **Metrics:** Move value inside each metric card; single container per metric (icon + label + value)
2. [x] **Metrics:** Apply label truncation or wrapping (e.g. `truncate` or `line-clamp` / `word-break`) so "PRs created/updated", "PR comments", "Commits pushed" stay within bounds
3. [x] **Check-ins:** Add `max-height` and `overflow-y: auto` to Check-ins textarea so content scrolls inside the field
4. [ ] **Check-ins (optional):** After save, show check-ins in a read-only, height-constrained block with "Show more" if needed (deferred: form does not receive saved check-ins from server)
5. [x] Verify on different viewport sizes and with long labels / long check-ins text
6. [x] Ensure "View details" (Plan 73) and Copy behavior still work after layout changes

## Success Criteria

- No content in the Metrics card overflows its card bounds; numbers are inside cards; labels are either fully visible or cleanly truncated/wrapped
- Check-ins text area does not overflow the layout; content scrolls inside the control (and optionally is shown in a bounded read-only block after save)
- Summary output (Build Summary + Metrics) looks contained and readable across breakpoints
- No regression on Metrics "View details" or Copy; layout remains accessible and scannable

---

## Resolution (Feb 2026)

- **MetricsCard** (`app/components/MetricsCard.tsx`): Each metric card now uses `min-w-0 overflow-hidden` so content stays inside; label is in a `min-w-0 flex-1` container with `truncate` and `title={label}` for tooltip; value block has `shrink-0` so numbers stay in-card; added `tabular-nums` for value alignment. "Repos worked on" section given `min-w-0` and `truncate` with `title` for long lists.
- **FullSummaryForm** (`app/components/FullSummaryForm.tsx`): Check-ins textarea now has `max-h-48 overflow-y-auto resize-y min-h-0` so content scrolls inside the field and the control does not overflow the layout; user can still resize vertically if desired.
- Optional post-save read-only check-ins block not implemented (would require server to return or client to persist check-ins text).
- Build and layout verified; View details and Copy unchanged and working.
