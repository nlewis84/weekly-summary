# PLAN-78: Toast Notifications Polish

**Status:** Draft · **Priority: P2** · **Effort: Small** · **Impact: Medium**

**Created Feb 2026:** Improve the visual design of data-refresh toasts and add a toast when a new weekly summary is built.

## Problem

1. **Data refreshed toast feels plain:** The current toast (`"Data refreshed"`) is a simple box with `bg-surface-elevated`, `border`, `rounded-xl`. It lacks visual polish—no icon, no sense of success, no subtle animation. It blends with the rest of the UI.

2. **No toast when weekly summary is built:** When the user builds a weekly summary via "Generate & Save" in `FullSummaryForm`, they get an inline success banner ("Saved to repository.") and a toast ("Summary saved to repository"). The toast exists but could be clearer and more celebratory—e.g. "Weekly summary built" or "Weekly summary built and saved." The user may want a distinct, prominent toast that confirms the build completed.

## Affected Components

| File | Role |
|------|------|
| `app/components/Toast.tsx` | Toast UI—styling, optional icon/variant support |
| `app/routes/_index.tsx` | Data refreshed toast |
| `app/routes/charts.tsx` | Data refreshed toast |
| `app/components/FullSummaryForm.tsx` | Weekly summary built toast |

## Solution

### 1. Nicer Data Refreshed Toast

**Option A – Enhance Toast component with optional variant:**

- Extend `ToastItem` to support a `variant`: `"default"` | `"success"` | `"info"`.
- For `"success"` (e.g. Data refreshed): add a check icon, use `bg-success-bg`, `border-success-border`, `text-success-500` for the icon.
- Keep the API simple: `toast("Data refreshed", { variant: "success" })` or add `toastSuccess()`.

**Option B – Visual polish without variants:**

- Add a small check/refresh icon (Phosphor or Lottie) to the data-refresh toast.
- Use success styling: `bg-success-bg border-success-border` with a subtle green accent.
- Add a brief slide-in or fade-in animation (e.g. `animate-in slide-in-from-right` with Tailwind).

**Recommendation:** Option B for minimal API change—pass an optional icon or variant. Enhance `Toast.tsx` to accept `{ message, variant?: "success" | "default" }` and render accordingly.

### 2. Toast When Weekly Summary Is Built

- **Current behavior:** `FullSummaryForm` already shows `toast("Summary saved to repository")` when `saved && builtAt && weekEnding`.
- **Change:** Update the message to be more descriptive: `"Weekly summary built and saved"` or keep both—a primary toast `"Weekly summary built"` with optional secondary text.
- **Alternative:** Show a more prominent success toast with icon (e.g. Lottie check) and message "Weekly summary built and saved."

**Recommendation:** Update the toast message to `"Weekly summary built and saved"` and use the same success variant/polish as the data-refresh toast for consistency.

### 3. Implementation Details

**Toast.tsx changes:**

- Add `variant?: "default" | "success"` to the toast API.
- For `variant === "success"`:
  - Use `bg-success-bg border-success-border rounded-xl`
  - Add a small check icon (e.g. Phosphor `Check` 20px) or LottieIcon `check` at reduced size
  - Optional: `animate-in slide-in-from-bottom-2 duration-200` for entry
- Backward compatible: `toast("msg")` continues to work with default styling.

**Call sites:**

- `_index.tsx`, `charts.tsx`: `toast("Data refreshed", { variant: "success" })`
- `FullSummaryForm.tsx`: `toast("Weekly summary built and saved", { variant: "success" })`

## Tasks

1. [ ] Extend `Toast.tsx` to support optional `variant` (default | success)
2. [ ] Add success styling: `bg-success-bg border-success-border` + check icon for success variant
3. [ ] Add entry animation (e.g. slide-in-from-bottom, fade) to toast container
4. [ ] Update `_index.tsx` and `charts.tsx` to use `toast("Data refreshed", { variant: "success" })`
5. [ ] Update `FullSummaryForm.tsx` to use `toast("Weekly summary built and saved", { variant: "success" })`
6. [ ] Verify dark mode and theme compatibility
7. [ ] Update plans/README.md with Plan 78

## Success Criteria

- Data refreshed toast has a cleaner, more polished look (success styling, optional icon)
- Weekly summary build shows a clear toast: "Weekly summary built and saved"
- Toasts remain accessible (aria-live, auto-dismiss)
- No regressions in copy, export, or other toast flows
