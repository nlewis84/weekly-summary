# Plan 81: Build Weekly Summary – Post-Generation UX (Duplicate Prevention & Clarity)

**Status:** Done · **Priority: P2** · **Effort: Small–Medium** · **Impact: Medium**

**Created Feb 2026:** After a user generates a weekly summary, the form and "Generate & Save" button remain fully visible. We already show "Last built: just now (week ending Feb 12, 2026)" and a "Saved to repository" message, but the UX around duplicate prevention and clarity can be improved. This plan considers whether to hide the input/button, surface that a summary already exists for the week, and show when it was created.

**Screenshot (current state):** [Build Weekly Summary after generation](/Users/nlewis/.cursor/projects/Users-nlewis-Development-weekly-summary/assets/Screenshot_2026-02-11_at_2.25.34_PM-3792971e-d2ba-493f-8a06-fa2ff582588f.png) — "Last built: just now", success message, but Check-ins and "Generate & Save" still visible and active.

## Problem

- **Current behavior:** Once a summary is built, "Last built: X (week ending Y)" and "Saved to repository" are shown, but the Check-ins textarea, "Today only" checkbox, and "Generate & Save" button stay visible and actionable.
- **Risks:** Users may run "Generate & Save" again by habit or by not noticing the success state, leading to duplicate commits or overwrites for the same week. The primary action (Generate & Save) competes with the "already done" message.
- **Desired outcome:** Clear signal that a summary exists for this week, when it was created, and a deliberate UX choice about whether to hide or de-emphasize the form/button to reduce accidental duplicates while still allowing intentional re-runs (e.g. "today only" or corrected check-ins).

## UX Considerations

| Question | Options | Recommendation |
|----------|---------|----------------|
| Hide input and button after generation? | **A.** Hide form and button once summary exists for the week. **B.** Keep visible but disabled. **C.** Keep visible and enabled (current). **D.** Collapse form by default; show "Last built" prominently; "Generate again" expands form. | **D** or **B**: Prefer **D** — collapse the form after success and lead with "Last built: X (week ending Y)". Add a clear "Generate again" or "Edit & regenerate" that expands the form. If re-run is rare, **B** (disabled with tooltip "Summary already built for this week") is simpler. |
| Show that a summary already exists for this week? | Yes / No | **Yes.** "Last built" already does this; ensure it’s above the fold and prominent (e.g. in card header or first line of Build Summary card). |
| Show when it was created to avoid duplicates? | Yes / No | **Yes.** Keep "Last built: &lt;relative time&gt; (week ending &lt;date&gt;)" so users see both recency and week scope. Optionally add "Summary for this week already exists" when week matches. |

## Options (Summary)

- **Option A – Hide after success:** After "Generate & Save" succeeds, hide Check-ins, Today only, and button; show only "Last built" and success message. "Generate again" link/button reveals form. Reduces duplicates; slight extra click for re-run.
- **Option B – Disable after success:** Keep form visible but disable "Generate & Save" when a summary exists for the current week; show tooltip or inline text: "Summary for this week already exists. Use 'Generate again' to overwrite." "Generate again" enables form or goes to confirmation.
- **Option C – Collapse, don’t hide:** Form is in a collapsed section by default after success. Card shows "Last built: X (week ending Y)" and "Saved to repository" (or dismissible). "Edit check-ins & generate again" expands the form. Balances visibility of state with avoiding accidental clicks.
- **Option D – No change:** Keep current behavior; rely on "Last built" and success message. Easiest but weakest duplicate prevention.

## Recommendation

- **Primary:** **Option C (Collapse after success).** After a successful build, collapse the Build Summary form and show at the top of the card: "Last built: &lt;relative&gt; (week ending &lt;date&gt;)" and a brief success state (e.g. "Saved to repository" that can auto-dismiss or stay). Prominent "Edit check-ins & generate again" control expands the form so re-runs are intentional.
- **Fallback:** **Option B** if we want to avoid any "hidden" UI — keep form visible, disable "Generate & Save" when summary exists for the week, and add "Generate again" that enables overwrite (with optional confirmation).

## Affected Files (Expected)

| File | Role |
|------|------|
| `app/routes/_index.tsx` (or where Build Summary card lives) | Layout of Build Summary card; collapse/expand state |
| FullSummaryForm (or equivalent) | Show/hide or disable form and button based on "summary exists for this week"; "Last built" placement; "Generate again" action |
| Loader/action that provides `lastBuilt`, `weekEnding` | Already used for "Last built" — may need `summaryExistsForCurrentWeek` or equivalent |

## Tasks

1. [x] Decide: Option C (collapse) vs B (disable) vs A (hide); document in this plan
2. [x] Ensure "Last built: X (week ending Y)" is prominent (e.g. first line of Build Summary card when summary exists)
3. [x] If Option C: Add collapsed state after successful build; "Edit check-ins & generate again" expands form
4. [ ] If Option B: Disable "Generate & Save" when summary exists for current week; add "Generate again" (and optional overwrite confirmation)
5. [ ] If Option A: Hide form/button after success; "Generate again" reveals them
6. [ ] Optional: "Summary for this week already exists" when week matches
7. [x] Test: Build summary → verify duplicate prevention and that intentional re-run still works (today only / overwrite)

## Success Criteria

- User clearly sees that a weekly summary has already been created for the current week
- User sees when it was created ("Last built: X (week ending Y)")
- Accidental duplicate "Generate & Save" is reduced (via collapse, disable, or hide)
- Intentional re-run (e.g. "Generate again", "Today only") remains possible and discoverable
- No regression on existing "Last built" or save flow (Plan 21)
