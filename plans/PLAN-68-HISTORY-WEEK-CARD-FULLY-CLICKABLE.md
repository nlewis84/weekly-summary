# PLAN-68: History Week Cards Fully Clickable

**Status:** Draft · **Priority: P2** · **Effort: Small** · **Impact: Medium**

## Overview

Make the entire week card row on `/history` clickable to open the week detail. Currently only the link text (icon, label, date) is clickable; the gap between the checkbox and the link, and the card padding, are dead zones.

## Problem

In `app/routes/history._index.tsx`, each week row is structured as:

```
[checkbox button] [gap] [Link: icon | label | date]
```

- The `Link` has `flex flex-1` and wraps the icon, label, and date.
- The `gap-3` between the checkbox and Link creates a non-clickable area.
- The card has `p-4` padding; the outer padding area is inside the flex container but outside both children, so it is not clickable.
- Users expect to click anywhere on the card to open the week.

## Current Structure

```tsx
<div className="flex items-center gap-3 p-4 ...">
  <button onClick={toggleWeek} ...>  {/* checkbox */}
  <Link to={`/history/${week}`} className="flex flex-1 ...">
    <CalendarBlank />
    <span>Week ending ...</span>
    <span>{week}</span>
  </Link>
</div>
```

## Approach

Use the **card-as-link** pattern: make the whole card a click target while keeping the checkbox as a separate, non-nested interactive element.

### Option A: Link Overlay (Recommended)

- Wrap the card in a `position: relative` container.
- Add a `Link` with `absolute inset-0` and `z-0` so it covers the entire card.
- Keep the checkbox as a sibling with `relative z-10` so it sits on top and receives clicks first.
- Put the visible content (icon, label, date) inside the Link so it remains the semantic target.
- The Link needs `pl-10` or similar to offset its content so it doesn’t overlap the checkbox visually (or use a spacer div). The Link covers the full card; when the user clicks the checkbox, the button (z-10) receives the click. When they click anywhere else, the Link receives the click.

**Structure:**

```tsx
<li key={week}>
  <div className="relative flex items-center gap-3 p-4 ...">
    <Link
      to={`/history/${week}`}
      prefetch="intent"
      className="absolute inset-0 z-0 flex items-center rounded-xl"
      aria-label={`Week ending ${formatWeekLabel(week)}`}
    >
      <span className="w-8 shrink-0" aria-hidden />  {/* spacer for checkbox */}
      <CalendarBlank ... />
      <span>Week ending ...</span>
      <span className="ml-auto">...</span>
    </Link>
    <button
      type="button"
      className="relative z-10 shrink-0 ..."
      onClick={(e) => { e.preventDefault(); toggleWeek(week); }}
      ...
    >
      {/* checkbox */}
    </button>
    <div className="relative z-10 flex-1 flex items-center gap-3 min-w-0 pointer-events-none">
      {/* Visual content - duplicates for layout; clicks pass through to Link */}
    </div>
  </div>
</li>
```

**Issue with Option A:** Duplicating content for layout is messy. Simpler variant: put all content inside the Link, and position the Link with `pl-10` so its content starts after the checkbox. The Link is `absolute inset-0`; the button is `relative z-10` and takes its normal space. The Link’s flex content uses `pl-10` to align with the current layout. No duplication needed.

**Simplified Option A:**

```tsx
<div className="relative flex items-center gap-3 p-4 ...">
  <Link
    to={`/history/${week}`}
    prefetch="intent"
    className="absolute inset-0 z-0 flex items-center gap-3 rounded-xl pl-10"
    aria-label={`Week ending ${formatWeekLabel(week)}`}
  >
    <CalendarBlank ... />
    <span>Week ending ...</span>
    <span className="ml-auto">...</span>
  </Link>
  <button className="relative z-10 shrink-0 ..." onClick={...}>
    {/* checkbox */}
  </button>
  <div className="relative z-10 flex-1 flex items-center gap-3 min-w-0 pointer-events-none" aria-hidden>
    <CalendarBlank ... />
    <span>Week ending ...</span>
    <span className="ml-auto">...</span>
  </div>
</div>
```

Still duplicates content. Better: **single Link as overlay, content in a non-interactive layer**. The Link has no visible content; it’s just a transparent overlay. The content is in a `pointer-events-none` div so clicks pass through to the Link. The button has `pointer-events-auto` so it receives clicks.

```tsx
<div className="relative flex items-center gap-3 p-4 ...">
  <Link
    to={`/history/${week}`}
    prefetch="intent"
    className="absolute inset-0 z-0 rounded-xl"
    aria-label={`Week ending ${formatWeekLabel(week)}`}
  />
  <button className="relative z-10 shrink-0 ..." onClick={...}>
    {/* checkbox */}
  </button>
  <div className="relative z-10 flex-1 flex items-center gap-3 min-w-0 pointer-events-none">
    <CalendarBlank ... />
    <span>Week ending ...</span>
    <span className="ml-auto">...</span>
  </div>
</div>
```

This works: empty Link overlay + `pointer-events-none` on content + button stays interactive.

### Option B: Card onClick + useNavigate

- Add `onClick` to the card div that calls `navigate(\`/history/${week}\`)`.
- Add `e.stopPropagation()` to the checkbox’s `onClick`.
- Add `cursor-pointer` to the card.
- Add a hidden `<Link to={...} prefetch="intent" />` for prefetch (or accept no prefetch on card click).

**Pros:** Simple, no z-index.  
**Cons:** Loses native link semantics; need to handle keyboard (Enter/Space) and right-click “Open in new tab” manually if we want full link behavior.

## Recommendation

Use **Option A (empty Link overlay)**. It preserves:

- Prefetch on hover
- Native link semantics (right-click menu, middle-click, etc.)
- Accessibility (screen readers see a link with an `aria-label`)

## Implementation

1. **`app/routes/history._index.tsx`**
   - Add `position: relative` to the card container.
   - Add a `Link` with `absolute inset-0 z-0 rounded-xl` and `aria-label`.
   - Add `pointer-events-none` to the content wrapper (the current Link’s children become a div).
   - Add `relative z-10` to the checkbox button.
   - Ensure the checkbox `onClick` still calls `e.preventDefault()` (for safety) and `toggleWeek(week)`.

2. **Accessibility**
   - The overlay Link needs `aria-label={`Week ending ${formatWeekLabel(week)}`}` since it has no visible text content.
   - Ensure the checkbox retains `aria-label` for select/deselect.

3. **Cursor**
   - Add `cursor-pointer` to the card or Link so the whole row shows pointer on hover.

## Verification

- Click anywhere on the card (except the checkbox) → navigates to `/history/:week`.
- Click the checkbox → toggles selection, does not navigate.
- Hover over the card → prefetch requests in Network tab.
- Right-click → “Open in new tab” works.
- Screen reader announces the link correctly.

## Out of Scope

- Other clickable cards in the app (e.g. main page, charts) — address separately if needed.
- Keyboard navigation within the list (arrow keys to move between cards) — future enhancement.
