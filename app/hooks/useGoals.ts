/**
 * Weekly goals - optional targets for key metrics.
 * Persisted in localStorage. Goals apply to the current week.
 */

import { useState, useEffect, useCallback } from "react";

export interface WeeklyGoals {
  prs_merged?: number;
  pr_reviews?: number;
  linear_completed?: number;
}

const STORAGE_KEY = "weekly-summary-goals";
const GOALS_CHANGED_EVENT = "weekly-summary-goals-changed";

function loadGoals(): WeeklyGoals {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const goals: WeeklyGoals = {};
    if (typeof parsed.prs_merged === "number" && parsed.prs_merged > 0) goals.prs_merged = parsed.prs_merged;
    if (typeof parsed.pr_reviews === "number" && parsed.pr_reviews > 0) goals.pr_reviews = parsed.pr_reviews;
    if (typeof parsed.linear_completed === "number" && parsed.linear_completed > 0) goals.linear_completed = parsed.linear_completed;
    return goals;
  } catch {
    return {};
  }
}

function saveGoals(goals: WeeklyGoals) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  window.dispatchEvent(new CustomEvent(GOALS_CHANGED_EVENT, { detail: goals }));
}

export function getStoredGoals(): WeeklyGoals {
  return loadGoals();
}

export function useGoals() {
  const [goals, setGoalsState] = useState<WeeklyGoals>(() => loadGoals());

  useEffect(() => {
    const handler = () => setGoalsState(loadGoals());
    window.addEventListener(GOALS_CHANGED_EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(GOALS_CHANGED_EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setGoals = useCallback((next: WeeklyGoals) => {
    saveGoals(next);
    setGoalsState(next);
  }, []);

  const clearGoals = useCallback(() => {
    saveGoals({});
    setGoalsState({});
  }, []);

  return { goals, setGoals, clearGoals };
}
