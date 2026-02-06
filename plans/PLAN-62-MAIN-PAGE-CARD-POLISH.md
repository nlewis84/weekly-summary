# Plan 62: Main Page Card Polish & This Week Revamp

**Status:** ✅ Complete · **Priority: P2** · **Effort: Medium** · **Impact: Medium**

**Created Feb 2026:** Addresses layout alignment, card consistency, removal of low-value UI, and a style-guide-driven revamp of the This Week card. Uses the Refactoring UI style guide (Apollos `style_guide/index.md` and PNGs) as the north star.

## Problem

1. **Build Weekly Summary height mismatch:** On the two-column layout (xl), the Build Summary card sits slightly higher and is shorter than the Metrics card. They should align at the top and have comparable visual weight.

2. **Inconsistent dividers:** Build Weekly Summary has a divider under its header; Metrics and This Week do not. Users like the divider—it should be consistent across all three cards.

3. **Check-ins template buttons:** The "+ PR reviews", "+ Feature work", etc. buttons below the Check-ins label add clutter without clear value. Remove them.

4. **This Week card needs revamp:** The current grid of metric cells feels busy and doesn't follow Refactoring UI principles. Needs a cleaner, more hierarchical design.

## Style Guide References (Refactoring UI)

From `style_guide/index.md` and PNGs—**do not reference DESIGN_SYSTEM.md**:

| Page | Concept | Application |
|------|---------|-------------|
| **30** | Not all elements are equal | Clear visual hierarchy; primary numbers stand out |
| **33** | Size isn't everything | Use font size/weight and color for hierarchy; softer color for secondary text |
| **41** | Labels are a last resort | Avoid naive `label: value`; use format and context instead |
| **60** | Establish spacing system | Consistent spacing values; avoid arbitrary numbers |
| **88** | Establish type scale | Consistent font sizes across the card |
| **150** | Emulate light source | Inset vs raised; depth through shadows |
| **206** | Use fewer borders | Separation via spacing and backgrounds; reduce border clutter |
| **192** | Supercharge defaults | Icons add meaning; avoid generic bullets |
| **210** | Think outside the box | Consider alternative layouts beyond a dense grid |

## Affected Files

| File | Role |
|------|------|
| `app/routes/_index.tsx` | Two-column layout; may need `items-stretch` or min-height for alignment |
| `app/components/MetricsCard.tsx` | Add header divider |
| `app/components/WeeklyTicker.tsx` | Add header divider; full revamp |
| `app/components/FullSummaryForm.tsx` | Remove Check-ins buttons; add min-height or flex to match Metrics |
| `app/components/FullSummaryFormContainer.tsx` | Wrapper for Build Summary; may need height/stretch tweaks |

## Solution

### 1. Card Height Alignment (Build Summary vs Metrics)

- On xl two-column layout, ensure both columns use `items-stretch` so cards fill the same vertical space.
- Give Build Summary form container `min-h-0` and `flex-1` (or equivalent) so it expands to match the left column when the details element is open.
- Consider `min-height` on the Build Summary card when open so it visually matches Metrics card height.

### 2. Consistent Header Dividers

- **MetricsCard:** Add `border-b border-[var(--color-border)] pb-4 mb-4` (or similar) to the header row so the divider sits under "Metrics" + Copy button.
- **WeeklyTicker:** Same pattern—divider under "This week" + Copy button.
- **FullSummaryForm:** Keep existing `border-t` under summary; ensure the pattern matches (divider separates header from body).

### 3. Remove Check-ins Template Buttons

- In `FullSummaryForm.tsx`, remove the `div` containing the "+ PR reviews", "+ Feature work", etc. buttons.
- Keep the Check-ins label and textarea only.
- Simplify the form layout.

### 4. This Week Card Revamp (Style Guide Driven)

**Current issues:**
- Dense grid of 7 metric cells with borders and shadows
- Heavy use of borders (Page 206: use fewer borders)
- Label-heavy format (Page 41: labels are a last resort)
- Inconsistent visual hierarchy (Page 30, 33)

**Proposed direction:**

- **Layout:** Consider a cleaner list or compact table instead of a grid of bordered cells. Use spacing and background contrast for separation (Page 206).
- **Hierarchy:** Make the primary numbers (values) dominant; use softer color for labels/supporting text (Page 33).
- **Type scale:** Establish consistent sizes—e.g. metric value (larger, bold), label (smaller, muted), trend (smallest) (Page 88).
- **Depth:** Use subtle background differences instead of borders for metric rows (Page 150, 206). Alternating row backgrounds or a single elevated surface with spacing.
- **Icons:** Keep icons for each metric type; they add meaning (Page 192).
- **Repos:** Integrate repos more subtly—perhaps inline or as a compact footer, not a full bordered block.
- **Goals/progress:** Keep goal progress indicators but simplify—e.g. a thin progress bar or checkmark without heavy borders.

**Concrete options for This Week:**

- **Option A – Compact list:** One card with a list of metrics. Each row: icon + label (muted) + value (bold) + trend. No per-cell borders; use `bg-[var(--color-surface-elevated)]` on hover or alternating rows.
- **Option B – Horizontal summary bar:** On large screens, show key metrics in a single horizontal bar (e.g. "3 PRs · 12 reviews · 6 Linear" style) with expand/collapse for full detail.
- **Option C – Refined grid:** Keep grid structure but remove borders from individual cells; use spacing and a single card background. Softer typography hierarchy.

Recommend **Option A** or **Option C** for clarity and alignment with "use fewer borders" and "labels are a last resort."

## Tasks

1. [x] Align Build Summary card height with Metrics card on xl layout (`items-stretch`, min-height, or flex)
2. [x] Add header divider to MetricsCard (consistent with Build Summary)
3. [x] Add header divider to WeeklyTicker (consistent with Build Summary)
4. [x] Remove Check-ins template buttons from FullSummaryForm
5. [x] Revamp WeeklyTicker layout per style guide (fewer borders, clearer hierarchy, spacing-based separation)
6. [x] Verify responsive behavior on mobile and tablet
7. [x] Update plans/README.md with Plan 62

## Success Criteria

- Build Summary and Metrics cards align at top and have comparable height on xl screens
- All three cards (Metrics, Build Summary, This Week) have a consistent divider under their headers
- Check-ins section shows only label + textarea (no template buttons)
- This Week card follows Refactoring UI principles: fewer borders, clearer hierarchy, spacing-based separation
- Layout remains responsive; no regressions on History, Charts, or Settings
