# Plan 80: Styles Audit – Tailwind Only, No Style Prop

**Status:** Draft · **Priority: P2** · **Effort: Medium** · **Impact: Medium (code quality, consistency)**

**Created Feb 2026:** Audit the codebase to ensure we use only Tailwind utility classes for styling and eliminate all `style` prop usage. This aligns with the Style Guide and PLAN-71 (Tailwind Canonical Classes).

## Goal

- **Use only Tailwind classes** for styling
- **Never use the `style` prop** in components
- Document any required exceptions and escape hatches

## Current State: Style Prop Usage

| File | Line | Usage | Convertible? |
|------|------|-------|--------------|
| `app/root.tsx` | 73 | `style={{ colorScheme: "dark" }}` | Partially: Tailwind v4 has `color-scheme-dark`; root may need JS-driven class/attr |
| `app/components/MetricsCard.tsx` | 252 | `style={{ gridTemplateRows: detailsOpen ? "1fr" : "0fr" }}` | **Yes** – use conditional `grid-rows-[0fr]` / `grid-rows-[1fr]` |
| `app/components/ChartsContent.tsx` | 264 | `style={{ height: reposChartHeight }}` | **Dynamic** – computed height; needs escape hatch |
| `app/components/WeeklyTicker.tsx` | 172 | `style={{ width: `${(value/target)*100}%` }}` | **Dynamic** – progress bar; needs escape hatch |
| `app/components/LottieIcon.tsx` | 50, 60, 68 | `style={{ width: size, height: size }}` | **Yes** – use size map → Tailwind classes (`w-6 h-6`, `w-12 h-12`, etc.) |
| `app/components/ui/chart.tsx` | 220 | `style={{ "--color-bg": indicatorColor, "--color-border": indicatorColor }}` | **Dynamic** – chart payload colors; escape hatch |
| `app/components/ui/chart.tsx` | 306 | `style={{ backgroundColor: item.color }}` | **Dynamic** – chart legend item color; escape hatch |

## Audit Phases

### Phase 0: Style Guide Update

Update `docs/STYLE-GUIDE.md`:

- [ ] **Add "No Inline Styles" section** – Prefer Tailwind classes for all styling. Do not use the `style` prop except where documented below.
- [ ] **Add "Escape Hatches" section** – Document when `style` is acceptable:
  - **Dynamic runtime values** (e.g. chart heights from hooks, progress bar widths from data)
  - **Third-party component props** (e.g. Lottie Player passing `style` to its internal DOM)
  - **CSS custom properties for dynamic values** – when a parent must set `--var` for a child to consume via Tailwind `h-[var(--x)]`
- [ ] **Recommendation** – For dynamic values, prefer CSS variables (`style={{ '--chart-height': height }}`) + Tailwind (`h-[var(--chart-height)]`) over direct style properties where possible, so Tailwind still owns the rule.

### Phase 1: Automated Audit

Create a one-off audit script or Grep-based checklist:

- [ ] **Grep for `style={`** – Enumerate all usages (done above)
- [ ] **Grep for `style=`** – Catch string or spread styles
- [ ] **Optional:** Add ESLint rule `react/forbid-component-props` for `style` on custom components (with overrides for root or third-party wrappers)
- [ ] **Optional:** Add to CI/pre-commit – fail or warn on new `style` usage in `app/` (excluding escape-hatch files)

### Phase 2: Convert What Can Be Converted

#### 2.1 MetricsCard.tsx – `gridTemplateRows` (Easy)

**Before:**
```tsx
<div
  className="grid transition-[grid-template-rows] duration-300 ease-out"
  style={{ gridTemplateRows: detailsOpen ? "1fr" : "0fr" }}
>
```

**After:**
```tsx
<div
  className={cn(
    "grid transition-[grid-template-rows] duration-300 ease-out",
    detailsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
  )}
>
```

#### 2.2 LottieIcon.tsx – Size (Easy)

**Strategy:** Map `size` prop to Tailwind classes. Common sizes: 16, 20, 24, 32, 48, 64.

| size | Tailwind |
|------|----------|
| 16 | `w-4 h-4` |
| 20 | `w-5 h-5` |
| 24 | `w-6 h-6` |
| 32 | `w-8 h-8` |
| 48 | `w-12 h-12` |
| 64 | `w-16 h-16` |

- [ ] Add `SIZE_CLASSES: Record<number, string>` map
- [ ] Default to `w-6 h-6` (24) when size is not in map; optionally add `size-6` etc. to safelist if needed
- [ ] For Lottie Player: it accepts `style` as a prop – this is a third-party component. Document as escape hatch or pass `className` if the Player supports it (check @lottiefiles/react-lottie-player API)

**Note:** If Lottie Player only accepts `style` for dimensions, keep that one usage and document it as an exception for third-party components.

#### 2.3 root.tsx – `colorScheme` (Medium)

- [ ] Check if Tailwind v4 `color-scheme-dark` / `color-scheme-light` can be applied via class on `<html>`
- [ ] The inline script already toggles `document.documentElement.classList.add(r?"dark":"light")` and `document.documentElement.style.colorScheme = r ? "dark" : "light"`
- [ ] **Option A:** Add `color-scheme-dark` and `color-scheme-light` classes in `tailwind.css` (or via Tailwind utilities), and have the script set the class instead of `style.colorScheme`
- [ ] **Option B:** If `color-scheme` must be set via JS for correct behavior, document as exception for root `<html>` only

### Phase 3: Document Escape Hatches

Files/components that must retain `style` for dynamic values:

| File | Reason |
|------|--------|
| `ChartsContent.tsx` | `reposChartHeight` – computed from container/resize; no static Tailwind equivalent |
| `WeeklyTicker.tsx` | Progress bar width – `(value/target)*100%`; dynamic |
| `app/components/ui/chart.tsx` | Chart tooltip/legend colors from payload – Recharts/shadcn chart data |

**Mitigation for escape hatches:**

- Prefer `style={{ '--var': value }}` + Tailwind `h-[var(--var)]` / `w-[var(--var)]` when the value is a single dynamic token
- Add a brief comment above each `style` usage: `// Escape hatch: dynamic value – see STYLE-GUIDE.md`
- Keep escape-hatch files to a minimum; when adding new components, prefer fixed Tailwind classes or a size/token map

### Phase 4: Prevent Regressions

- [ ] **Add to Style Guide** – "Do not add new `style` props without documenting the escape hatch in this file and in STYLE-GUIDE.md"
- [ ] **Code review checklist** – Flag any new `style` usage in PRs
- [ ] **Optional:** ESLint override for `style` in `app/` (with `ignore` for known escape-hatch paths)

## Affected Files Summary

| File | Action |
|------|--------|
| `docs/STYLE-GUIDE.md` | Add "No Inline Styles" and "Escape Hatches" sections |
| `app/root.tsx` | Evaluate `color-scheme` → class-based approach |
| `app/components/MetricsCard.tsx` | Replace `style` with `grid-rows-[0fr]` / `grid-rows-[1fr]` |
| `app/components/LottieIcon.tsx` | Replace `style` with size map + Tailwind; document Lottie Player if needed |
| `app/components/ChartsContent.tsx` | Document escape hatch; optionally use `--chart-height` + `h-[var(--chart-height)]` |
| `app/components/WeeklyTicker.tsx` | Document escape hatch; optionally use `--progress` + `w-[var(--progress)]` |
| `app/components/ui/chart.tsx` | Document escape hatch for chart payload colors |

## Tasks

1. [ ] Update STYLE-GUIDE.md with "No Inline Styles" and "Escape Hatches"
2. [ ] Convert MetricsCard `gridTemplateRows` to Tailwind
3. [ ] Convert LottieIcon size to Tailwind size map (and document Lottie Player exception if needed)
4. [ ] Evaluate root.tsx `colorScheme` → class-based
5. [ ] Add escape-hatch comments to ChartsContent, WeeklyTicker, chart.tsx
6. [ ] Run full audit: `rg 'style=\{' app/` and confirm list matches this plan
7. [ ] Add code review / ESLint note to prevent new `style` usage

## Success Criteria

- Zero `style` props in app code except documented escape hatches
- Style Guide clearly defines when escape hatches are allowed
- MetricsCard and LottieIcon use only Tailwind
- No visual regressions
- Build passes
