/**
 * Pure month/target math, shared by the server fetcher and the browser.
 *
 * Kept free of every server-only import (cache, GitHub client) so the progress
 * card can recompute pace the instant the target changes — pulling in
 * `monthly-progress` would drag `process.env` into the client bundle.
 */

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export interface MonthlyMergedPr {
  title: string;
  url: string;
  repo: string | null;
  merged_at: string;
  /** Local calendar day the merge lands on (YYYY-MM-DD) */
  day: string;
}

export interface MonthlyDay {
  /** YYYY-MM-DD */
  date: string;
  /** Day of month, 1-based */
  day: number;
  isBusinessDay: boolean;
  /** Past the through-date, so it has no data yet */
  isFuture: boolean;
  merged: number;
  /** Running total through this day; null once the days run past `through` */
  cumulative: number | null;
}

export interface MonthlyProgress {
  /** YYYY-MM */
  month: string;
  /** "August 2026" */
  label: string;
  /** Merged PRs so far this month */
  merged: number;
  days: MonthlyDay[];
  daysInMonth: number;
  businessDaysInMonth: number;
  /** Business days from the 1st through `through`, inclusive */
  businessDaysElapsed: number;
  /** Last day with data — today for the current month, month end for a past one */
  through: string;
  isCurrentMonth: boolean;
  topRepos: { repo: string; count: number }[];
  generated_at: string;
  /** Served from the last good fetch because GitHub refused a fresh search. */
  stale?: boolean;
}

export interface PaceSummary {
  target: number;
  merged: number;
  /** Merged as a share of target; can exceed 100 */
  pct: number;
  /** Still needed to hit target; 0 once met */
  remaining: number;
  /** Where a steady pace would have you by `through` */
  expected: number;
  /** Month-end total if the current per-business-day rate holds */
  projected: number;
  businessDaysLeft: number;
  /** Per remaining business day needed to land on target; null when met or out of days */
  perDayNeeded: number | null;
  status: "met" | "ahead" | "on-pace" | "behind";
}

/** YYYY-MM for the local calendar month containing `now`. */
export function currentMonth(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return month;
  return `${MONTH_LABELS[m - 1]} ${y}`;
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return 30;
  return new Date(y, m, 0).getDate();
}

function isBusinessDay(d: Date): boolean {
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

/** Mon–Fri in the month. Holidays are not modelled — pace is a guide, not payroll. */
export function businessDaysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  const last = daysInMonth(month);
  let count = 0;
  for (let day = 1; day <= last; day++) {
    if (isBusinessDay(new Date(y, m - 1, day))) count++;
  }
  return count;
}

/** Mon–Fri from the 1st through `throughDay` (inclusive). */
export function businessDaysThrough(month: string, throughDay: number): number {
  const [y, m] = month.split("-").map(Number);
  const cap = Math.min(Math.max(throughDay, 0), daysInMonth(month));
  let count = 0;
  for (let day = 1; day <= cap; day++) {
    if (isBusinessDay(new Date(y, m - 1, day))) count++;
  }
  return count;
}

/**
 * Where a target sits relative to progress. Pure, so the client can recompute it
 * the moment the target changes without another round trip.
 */
export function computePace(
  progress: MonthlyProgress,
  target: number
): PaceSummary {
  const safeTarget = Math.max(1, Math.round(target));
  const { merged, businessDaysElapsed, businessDaysInMonth: totalBd } = progress;

  const expected =
    totalBd > 0
      ? Math.round((safeTarget * businessDaysElapsed * 10) / totalBd) / 10
      : 0;
  const businessDaysLeft = Math.max(0, totalBd - businessDaysElapsed);
  const remaining = Math.max(0, safeTarget - merged);
  const projected =
    businessDaysElapsed > 0
      ? Math.round((merged / businessDaysElapsed) * totalBd)
      : merged;
  const perDayNeeded =
    remaining > 0 && businessDaysLeft > 0
      ? Math.round((remaining / businessDaysLeft) * 10) / 10
      : null;
  const pct = Math.round((merged / safeTarget) * 100);

  // "On pace" is a band, not a point: one PR either side of the ideal line is
  // noise, and flagging it red every other day makes the badge worthless.
  const status: PaceSummary["status"] =
    merged >= safeTarget
      ? "met"
      : merged >= expected + 1
        ? "ahead"
        : merged >= expected - 1
          ? "on-pace"
          : "behind";

  return {
    target: safeTarget,
    merged,
    pct,
    remaining,
    expected,
    projected,
    businessDaysLeft,
    perDayNeeded,
    status,
  };
}

/** Bucket merged PRs into a full calendar month of days. */
export function buildMonthDays(
  month: string,
  prs: MonthlyMergedPr[],
  through: string
): MonthlyDay[] {
  const [y, m] = month.split("-").map(Number);
  const last = daysInMonth(month);
  const counts = new Map<string, number>();
  for (const pr of prs) {
    counts.set(pr.day, (counts.get(pr.day) ?? 0) + 1);
  }

  const days: MonthlyDay[] = [];
  let running = 0;
  for (let day = 1; day <= last; day++) {
    const date = `${month}-${pad2(day)}`;
    const isFuture = date > through;
    const merged = counts.get(date) ?? 0;
    if (!isFuture) running += merged;
    days.push({
      date,
      day,
      isBusinessDay: isBusinessDay(new Date(y, m - 1, day)),
      isFuture,
      merged: isFuture ? 0 : merged,
      cumulative: isFuture ? null : running,
    });
  }
  return days;
}
