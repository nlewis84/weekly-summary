# Plan 24: Toast Notifications

**Status: ✅ Complete** · **Priority: P0** · **Effort: Low** · **Impact: High**

## Problem

Copy and other actions give feedback via inline messages or alerts. A lightweight toast system would provide consistent, non-blocking feedback across the app.

## Tasks

1. [x] Add toast component (or use a minimal lib like sonner, react-hot-toast)
2. [x] Show toast on Copy success, Build success, Export success
3. [x] Auto-dismiss after 2–3 seconds
4. [x] Accessible (announce to screen readers, keyboard-dismissible)

## Success Criteria

- Copy/Build/Export show toast on success
- Toasts don't block interaction and disappear automatically

---

## Resolution

- ToastProvider + useToast context in app/components/Toast.tsx
- Toast on Copy stats (MetricsCard), Copy markdown (history week), Build saved (FullSummaryForm), Export CSV (charts)
- Auto-dismiss 2.5s, aria-live="polite" for screen readers
