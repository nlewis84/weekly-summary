/**
 * Monthly merged-PR target. One number, persisted in the browser, applied to
 * the current month. Kept apart from useGoals: those are weekly targets that
 * reset every Saturday, this one is the standing monthly expectation.
 */

import { useCallback, useEffect, useState } from "react";
import { readPref, writePref } from "~/lib/prefs-storage";

export const DEFAULT_MONTHLY_PR_TARGET = 28;

const STORAGE_KEY = "weekly-summary-monthly-pr-target";
const CHANGED_EVENT = "weekly-summary-monthly-target-changed";

function parseTarget(raw: string | null): number {
  if (!raw) return DEFAULT_MONTHLY_PR_TARGET;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MONTHLY_PR_TARGET;
}

export function useMonthlyPrTarget() {
  // Starts at the default on both server and first client render, then syncs —
  // reading storage in the initializer would render different markup than the
  // server sent and break hydration.
  const [target, setTargetState] = useState(DEFAULT_MONTHLY_PR_TARGET);

  useEffect(() => {
    const sync = () => setTargetState(parseTarget(readPref(STORAGE_KEY)));
    sync();
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setTarget = useCallback((next: number) => {
    const safe =
      Number.isFinite(next) && next > 0
        ? Math.round(next)
        : DEFAULT_MONTHLY_PR_TARGET;
    writePref(STORAGE_KEY, String(safe));
    setTargetState(safe);
    window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
  }, []);

  return { target, setTarget };
}
