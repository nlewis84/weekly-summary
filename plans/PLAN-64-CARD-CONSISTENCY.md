# Plan 64: Card Consistency & Style Guide Polish

**Status:** Draft · **Priority: P2** · **Effort: Small–Medium** · **Impact: Medium**

**Created Feb 2026:** Aligns Metrics and This week cards with the Build Weekly Summary card's header divider pattern, fixes height alignment, and addresses style guide feedback.

## User Requests

1. **Header divider:** The Build Weekly Summary card's header divider is preferred. Metrics and This week cards should match that pattern.
2. **Height alignment:** The This week card should be the same height as the Build Weekly Summary card on xl screens.

## Build Weekly Summary Divider Pattern (Reference)

The Build Summary uses `border-t border-[var(--color-border)]` on the content div, with `pt-4` for spacing below the divider:

```tsx
<summary className="... px-5 py-4 ...">Build Weekly Summary</summary>
<div className="px-5 pb-5 pt-4 border-t border-[var(--color-border)] ...">
  {/* content */}
</div>
```

The divider sits between header and content; the content block owns the border and top padding.

## Current State

- **MetricsCard:** Uses `border-b` on the header div with `pb-4 mb-4`. Divider is on the header.
- **WeeklyTicker:** Same—`border-b` on header with `pb-4 mb-4`.
- **Build Summary:** Uses `border-t` on content div with `pt-4`. Divider is on the content.

To match Build Summary, Metrics and This week should move the divider to the content wrapper (border-t, pt-4) instead of the header (border-b, pb-4, mb-4).

## Tasks

### 1. Header Divider Consistency

- [ ] **MetricsCard:** Change from `border-b pb-4 mb-4` on header to `border-t pt-4` on the content wrapper. Header gets `pb-4` only (no border). Content wrapper gets `border-t border-[var(--color-border)] pt-4`.
- [ ] **WeeklyTicker:** Same change—content wrapper gets `border-t pt-4`, header loses `border-b mb-4`.

### 2. This Week Card Height

- [ ] On xl, the This week card (WeeklyTicker) should match Build Summary height. The right two columns (Build Summary, This week) are in a grid with `items-stretch`. Build Summary column has `items-start` so its card doesn't stretch. This week column needs its card to stretch to match.
- [ ] Add `xl:h-full xl:flex xl:flex-col xl:min-h-0` to WeeklyTicker so it fills its grid cell. Ensure the WeeklySection wrapper and grid cell allow stretch.
- [ ] May need to remove `items-start` from Build Summary column and use a different approach, or ensure both columns use `items-stretch` with cards that fill. Verify Build Summary and This week cards align in height.

### 3. Style Guide Additions (Documentation)

- [ ] **Spacing system:** Add a spacing scale to `docs/STYLE-GUIDE.md`—e.g. use Tailwind's 4, 5, 6 (1rem, 1.25rem, 1.5rem) consistently. Avoid arbitrary values.
- [ ] **Metrics card internal spacing:** Ensure consistent `mt-4` or `pt-4` between sections (metric grid → Repos → View details).
- [ ] **Typography scale:** Document text sizes for card titles, labels, values (e.g. `text-lg` titles, `text-sm` labels, `text-base` values).

### 4. Repo List Overflow (This week card)

- [ ] Decide: truncate with ellipsis + tooltip, or allow wrap with consistent line-height. Document in style guide.

### 5. Header Alignment

- [ ] Align "Today" header / refresh controls with the left edge of the card grid for cleaner visual alignment.

## Affected Files

| File | Changes |
|------|---------|
| `app/components/MetricsCard.tsx` | Divider pattern to match Build Summary |
| `app/components/WeeklyTicker.tsx` | Divider pattern; add xl height stretch |
| `app/components/WeeklyTickerSkeleton.tsx` | Match divider pattern |
| `app/routes/_index.tsx` | Possibly adjust grid/column stretch for height alignment |
| `docs/STYLE-GUIDE.md` | Add spacing, typography, overflow guidance |

## Success Criteria

- Metrics and This week cards use the same header divider pattern as Build Weekly Summary (border-t on content, pt-4).
- This week and Build Summary cards have equal height on xl screens.
- Style guide documents spacing and typography for future consistency.
