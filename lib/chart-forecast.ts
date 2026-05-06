/**
 * Project chart metrics from local daily snapshots (pace × remaining calendar).
 */

import { loadDailySnapshot } from "./daily-snapshot.js";
import type { Payload, Stats } from "./types.js";

/** Scale snapshot sums to a full week (Sat–Fri, 7 days). */
const WEEK_TARGET_DAYS = 7;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Friday `week_ending` (YYYY-MM-DD) for the Sat–Fri week containing `now`,
 * matching `runSummary` / `payload.meta.week_ending` (local calendar).
 */
export function getCurrentWeekEndingFriday(now: Date): string {
  const day = now.getDay();
  const daysSinceSaturday = (day + 1) % 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() - daysSinceSaturday);
  saturday.setHours(0, 0, 0, 0);
  const friday = new Date(saturday);
  friday.setDate(saturday.getDate() + 6);
  return `${friday.getFullYear()}-${pad2(friday.getMonth() + 1)}-${pad2(friday.getDate())}`;
}

/** Inclusive calendar dates in the snapshot week window (7 days ending Friday). */
export function datesInWeekWindow(weekEnding: string): string[] {
  const end = new Date(weekEnding + "T23:59:59");
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(toYmd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Inclusive YYYY-MM dates from first of month through `through` (local). */
export function datesInMonthThrough(yearMonth: string, through: Date): string[] {
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return [];
  const lastDay = new Date(y, m, 0).getDate();
  const cap = new Date(through.getFullYear(), through.getMonth(), through.getDate());
  const monthEnd = new Date(y, m - 1, lastDay);
  const end = cap < monthEnd ? cap : monthEnd;
  const dates: string[] = [];
  const cur = new Date(y, m - 1, 1);
  while (cur <= end) {
    dates.push(toYmd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function daysInCalendarMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split("-").map(Number);
  if (!y || !m) return 30;
  return new Date(y, m, 0).getDate();
}

export interface ForecastChartMetrics {
  prs_merged: number;
  pr_reviews: number;
  pr_comments: number;
  commits_pushed: number;
  linear_completed: number;
  linear_worked_on: number;
  linear_issues_created: number;
  linear_comments: number;
  prs_total: number;
  repos_count: number;
}

function emptySums(): ForecastChartMetrics {
  return {
    prs_merged: 0,
    pr_reviews: 0,
    pr_comments: 0,
    commits_pushed: 0,
    linear_completed: 0,
    linear_worked_on: 0,
    linear_issues_created: 0,
    linear_comments: 0,
    prs_total: 0,
    repos_count: 0,
  };
}

function addStats(sums: ForecastChartMetrics, s: Stats): void {
  sums.prs_merged += s.prs_merged;
  sums.pr_reviews += s.pr_reviews;
  sums.pr_comments += s.pr_comments;
  sums.commits_pushed += s.commits_pushed ?? 0;
  sums.linear_completed += s.linear_completed;
  sums.linear_worked_on += s.linear_worked_on;
  sums.linear_issues_created += s.linear_issues_created ?? 0;
  sums.linear_comments += s.linear_comments ?? 0;
  sums.prs_total += s.prs_total;
  sums.repos_count += s.repos?.length ?? 0;
}

/**
 * Sum daily snapshot stats for `dates`, then scale each total by (targetDays / nSnapshots).
 * Returns null if no snapshots found.
 */
export function projectMetricsFromSnapshotDates(
  dates: string[],
  targetDays: number,
  load: (date: string) => Payload | null = loadDailySnapshot
): ForecastChartMetrics | null {
  const sums = emptySums();
  let n = 0;
  for (const date of dates) {
    const p = load(date);
    if (!p) continue;
    addStats(sums, p.stats);
    n += 1;
  }
  if (n === 0 || targetDays <= 0) return null;
  const factor = targetDays / n;
  return {
    prs_merged: Math.round(sums.prs_merged * factor),
    pr_reviews: Math.round(sums.pr_reviews * factor),
    pr_comments: Math.round(sums.pr_comments * factor),
    commits_pushed: Math.round(sums.commits_pushed * factor),
    linear_completed: Math.round(sums.linear_completed * factor),
    linear_worked_on: Math.round(sums.linear_worked_on * factor),
    linear_issues_created: Math.round(sums.linear_issues_created * factor),
    linear_comments: Math.round(sums.linear_comments * factor),
    prs_total: Math.round(sums.prs_total * factor),
    repos_count: Math.max(0, Math.round(sums.repos_count * factor)),
  };
}

export function forecastMetricsFromSnapshotsForWeek(
  weekEnding: string,
  load: (date: string) => Payload | null = loadDailySnapshot
): ForecastChartMetrics | null {
  const dates = datesInWeekWindow(weekEnding);
  return projectMetricsFromSnapshotDates(dates, WEEK_TARGET_DAYS, load);
}

/**
 * Month-to-date snapshots scaled to full calendar month length.
 */
export function forecastMetricsFromSnapshotsForMonth(
  yearMonth: string,
  now: Date,
  load: (date: string) => Payload | null = loadDailySnapshot
): ForecastChartMetrics | null {
  const dates = datesInMonthThrough(yearMonth, now);
  const dim = daysInCalendarMonth(yearMonth);
  return projectMetricsFromSnapshotDates(dates, dim, load);
}
