# Plan 54: Progress Charts Page – Holistic Redesign

**Status: ✅ Complete**  
**Priority: P2**  
**Effort: Medium–High**  
**Impact: High**

---

## Executive Summary

This plan addresses structural and conceptual questions about the Progress Charts page layout, makes explicit design decisions, and proposes a holistic redesign that improves clarity, mental model, and visual hierarchy.

---

## User Questions Addressed

### 1. Is it okay that GitHub stats and Linear stats are on the same "card"?

**Decision: Yes, but with clearer visual grouping.**

**Rationale:**

- GitHub (PRs, commits, reviews) and Linear (completed, worked on) represent a **single workflow**: a developer’s output across code and project management.
- Users typically care about “how much did I ship?” as a combined view, not as separate silos.
- Keeping them together supports quick scanning of overall productivity.
- **However**, the current layout treats all six metrics as a flat list. We should add **sub-grouping** within the card so the relationship is obvious:
  - **GitHub** (PRs merged, PR reviews, PR comments, Commits pushed)
  - **Linear** (Linear completed, Linear worked on)

**Implementation:** Add subtle section headers or dividers within the PRs & Linear card, or use two sub-cards (GitHub | Linear) inside one parent card. Avoid splitting into two full-page cards unless user research shows strong preference for separation.

---

### 2. Why are active repos separate from those stats?

**Decision: Keep repos separate, but clarify the rationale in the UI.**

**Rationale:**

- **Different dimension of data:**
  - PRs & Linear: **Action counts** (how many PRs, reviews, commits, Linear tasks) over time.
  - Repos: **Where** that activity happened (which repositories).
- **Different questions answered:**
  - Top card: “How much did I do?” (volume)
  - Repos card: “Where did I focus?” (distribution)
- Combining them would either:
  - Overload one card with unrelated axes, or
  - Force a single chart to answer two different questions poorly.

**Implementation:** Keep the separate card. Add a short explanatory subtitle or tooltip, e.g. “Where your PR activity is concentrated” or “Repository focus over time,” so the separation feels intentional rather than arbitrary.

---

### 3. Why six small charts for GitHub/Linear and one big chart for repos?

**Decision: Keep six small charts; reconsider repos chart size and layout.**

**Rationale for six small charts:**

- **Scale independence:** Each metric (PRs merged, reviews, commits, etc.) has a different typical range. Stacking them in one chart distorts trends (see PLAN-51).
- **Small multiples principle:** Same structure (line over time), different data. Users can compare patterns across metrics without scale confusion.
- **Readability:** One metric per chart = clear Y-axis, no overlapping lines, easier tooltips.
- **Cognitive load:** Six compact charts in a grid are scannable; one dense chart with six series is not.

**Rationale for repos chart being larger:**

- Repos data is **multi-series** (multiple repos over time) or **categorical** (bar chart of repos). A single chart needs more space to show:
  - Bar labels (repo names) without truncation
  - Multiple lines with a legend (over-time view)
- The “one big chart” is appropriate for this use case.

**Refinement:** The repos chart does not need to be *dramatically* larger than the individual metric charts. Consider:
- Making the six metric charts slightly larger (e.g., taller) so they feel less cramped.
- Keeping the repos chart at a similar visual weight but ensuring it has adequate space for labels and legend.
- Avoid a hierarchy where repos feels like “the main chart” and metrics feel like “supporting charts”—both answer important but different questions.

---

## Holistic Redesign Principles

### 1. Clear Information Hierarchy

| Level | Content | Purpose |
|-------|---------|---------|
| **Page** | Progress Charts | Overall productivity dashboard |
| **Section 1** | Output metrics (PRs & Linear) | “How much did I do?” |
| **Section 2** | Repository focus | “Where did I focus?” |

### 2. Consistent Mental Model

- **Time** flows left-to-right in all time-series charts.
- **Counts** use consistent Y-axis treatment (start at 0, numeric ticks).
- **Cards** group by question answered, not by data source.

### 3. Visual Balance

- Six metric charts: equal visual weight, responsive grid (2×3 desktop, 1-col mobile).
- Repos chart: proportional to content (bar chart height scales with repo count; line chart has fixed comfortable height).
- No single chart dominates unless it answers the primary question.

### 4. Sub-grouping Within PRs & Linear

```
┌─────────────────────────────────────────────────────────────┐
│ PRs & Linear                                                │
├─────────────────────────────────────────────────────────────┤
│ GitHub                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ PRs      │ │ PR       │ │ PR       │ │ Commits  │        │
│ │ merged   │ │ reviews  │ │ comments │ │ pushed   │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│ Linear                                                      │
│ ┌──────────┐ ┌──────────┐                                   │
│ │ Linear   │ │ Linear   │                                   │
│ │ completed│ │ worked on│                                   │
│ └──────────┘ └──────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

### 5. Repos Card Clarity

- **Title:** “Most Active Repos” (keep)
- **Subtitle (optional):** “Where your PR activity is concentrated”
- **View toggle:** “Most active” (bar) | “Over time” (line) — already implemented per PLAN-53.

---

## Implementation Tasks

### Phase 1: Sub-grouping (Low Effort)

1. [x] Add “GitHub” and “Linear” section labels or dividers within the PRs & Linear card.
2. [x] Optionally reorder metrics: GitHub block first (PRs merged, reviews, comments, commits), then Linear block (completed, worked on).
3. [x] Ensure grid layout accommodates 4+2 or 3+3 grouping if desired.

### Phase 2: Repos Card Polish (Low Effort)

1. [x] Add optional subtitle: “Where your PR activity is concentrated” or similar.
2. [x] Verify bar chart Y-axis width (130px) prevents label truncation.
3. [x] Ensure “Over time” view legend is readable and lines are distinguishable.

### Phase 3: Visual Balance (Medium Effort)

1. [x] Review metric chart heights—consider increasing from current size if they feel cramped.
2. [x] Ensure repos chart height is proportional (not excessively larger than metric charts).
3. [x] Align card padding, borders, and spacing for visual consistency.

### Phase 4: Export & Accessibility (Low Effort)

1. [x] Ensure CSV export includes all six metrics (already does per charts.tsx).
2. [x] Add `aria-describedby` or similar for repos card to explain its purpose.
3. [x] Verify keyboard navigation and screen reader flow for view toggle.

---

## Alternative Considered: Split GitHub and Linear

**Option:** Separate cards for “GitHub Activity” and “Linear Activity.”

**Rejected because:**
- Increases vertical scroll and cognitive switching.
- Users checking “how was my week?” would need to look at two places.
- The combined view supports the primary use case: holistic productivity check.

**Retain as future option** if users report wanting to focus on one platform at a time (e.g., “GitHub-only view” filter).

---

## Success Criteria

- [x] GitHub and Linear metrics are visually sub-grouped within the PRs & Linear card.
- [x] Repos card has clear purpose (subtitle or aria-label).
- [x] Six metric charts remain as small multiples with independent scales.
- [x] Repos chart remains a single, appropriately sized chart for its data type.
- [x] Overall hierarchy is clear: output metrics first, repository focus second.
- [x] No regressions in CSV export, E2E tests, or accessibility.

---

## Related Plans

- [PLAN-01-CHARTS](PLAN-01-CHARTS.md) – Charts overhaul (Tremor/Recharts)
- [PLAN-51-CHARTS-MULTI-STAT](PLAN-51-CHARTS-MULTI-STAT.md) – Small multiples for metrics
- [PLAN-53-REPOS-CHART-OPTIONS](PLAN-53-REPOS-CHART-OPTIONS.md) – Repos view toggle (Most active | Over time)
