# Plan 77: This Week Card – Repos Worked On Section Revamp

**Status: Draft** · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** Revamp the "repos worked on" section on the This week card to match the rest of the card's visual language and present the data in a more engaging way.

## Problem

The repos section on the This week card feels like an afterthought:

- **Structural mismatch:** It sits outside the main content area with no divider, unlike the metrics rows above it.
- **Visual inconsistency:** Uses `text-xs` in a bare `<p>` tag; metrics use `text-sm` labels, `text-base` values, and a row-based layout with icons and alternating backgrounds.
- **Flat presentation:** Repos are shown as a comma-separated string—easy to scan but visually dull and hard to distinguish at a glance.

## Current State

```tsx
// WeeklyTicker.tsx – repos section (lines 212–219)
<p className="mt-3 pt-3 text-xs text-text-muted flex items-center gap-1.5">
  <Folder size={14} weight="regular" className="text-primary-500 shrink-0" />
  {stats.repos.length > 0 ? stats.repos.join(", ") : "—"}
</p>
```

- No `border-t` divider; `mt-3 pt-3` only.
- No "Repos worked on" label.
- Comma-separated list with `text-xs`.

## Metrics Card Reference (Repos Section)

The Metrics card uses a clearer pattern:

```tsx
<div className="mt-4 pt-4 border-t border-(--color-border)">
  <span className="flex items-center gap-2 text-sm text-text-muted">
    <Folder size={24} weight="regular" className="text-primary-500 shrink-0" />
    Repos worked on
  </span>
  <p className="text-sm font-medium text-(--color-text) mt-1">
    {stats.repos.join(", ")}
  </p>
</div>
```

## Style Guide Compliance

From `docs/STYLE-GUIDE.md`:

| Rule | Application |
|------|-------------|
| **Spacing** | Use `mt-4 pt-4` between sections (like metrics rows → repos) |
| **Card header divider** | Content wrapper owns `border-t border-(--color-border)` |
| **Labels** | `text-sm text-text-muted` for labels |
| **Repo list overflow** | "Allow natural wrap with consistent `line-height` and `text-sm`" |
| **Typography** | Hints/secondary: `text-xs text-text-muted`; values: `text-base font-semibold` |
| **Theme variables** | Use `bg-surface`, `text-text-muted`, `border-(--color-border)` |

## Proposed Solution: Repo Chips

Present each repo as a **chip (pill)** that wraps naturally. This approach:

- **Matches the card:** Uses the same spacing scale, borders, and typography as the metrics rows.
- **Clear hierarchy:** Label "Repos worked on" with Folder icon; repos as chips below.
- **Clever presentation:** Chips are visually distinct, easy to scan, and add subtle structure without clutter.
- **Wraps well:** Per style guide, prefer wrap over truncate for readability.

### Design Spec

1. **Structure:** Move repos inside the content area. Add `border-t border-(--color-border)` and `pt-4` so it aligns with the metrics → repos divider pattern used in MetricsCard.

2. **Label:** "Repos worked on" with Folder icon, `text-sm text-text-muted` (match Metrics card).

3. **Repos as chips:**
   - Each repo: `inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium`
   - Background: `bg-surface-elevated` or `bg-primary-500/10` for subtle accent
   - Border: `border border-(--color-border)` for definition
   - Text: `text-(--color-text)` 
   - Wrap: `flex flex-wrap gap-2` container
   - Shorten display: Use `repo.split("/").pop()` for long `org/repo` names; full name in `title` tooltip

4. **Empty state:** "—" when `stats.repos.length === 0`, styled consistently.

### Alternative: Repos as Rows

If chips feel too busy, each repo could be a row matching the metric row style (icon + name, alternating `bg-surface-elevated/60`). Works well for 1–5 repos; gets long for 10+.

### Alternative: Minimal Upgrade

Keep comma list but: add divider, label "Repos worked on", use `text-sm` per style guide, and wrap in a proper section with `mt-4 pt-4 border-t`.

## Tasks

1. [ ] **Move repos into content area** – Place inside the same `pt-4 border-t` content wrapper; use `mt-4 pt-4 border-t` for the repos subsection.
2. [ ] **Add label** – "Repos worked on" with Folder icon, `text-sm text-text-muted`.
3. [ ] **Implement repo chips** – Chips that wrap; use `text-sm`, theme variables; optional `split("/").pop()` for display with full name in `title`.
4. [ ] **Handle empty state** – "—" when no repos, styled consistently.
5. [ ] **Update skeleton** – WeeklyTickerSkeleton: add a repos section placeholder (e.g. 2–3 chip-shaped skeletons) to prevent layout shift.

## Affected Files

| File | Changes |
|------|---------|
| `app/components/WeeklyTicker.tsx` | Revamp repos section: structure, label, chips |
| `app/components/WeeklyTickerSkeleton.tsx` | Add repos section skeleton |

## Success Criteria

- Repos section uses the same divider pattern as the metrics section (`border-t`, `pt-4`).
- "Repos worked on" label with Folder icon, `text-sm text-text-muted`.
- Repos displayed as chips that wrap naturally; `text-sm` per style guide.
- Theme variables only; no hardcoded colors.
- Skeleton matches new layout to avoid layout shift.
- Copy-to-clipboard still includes repos in the same format.
