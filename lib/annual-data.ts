/**
 * Aggregate weekly data by year for annual dashboard.
 */

import { listWeeklySummaries, fetchWeeklySummary } from "./github-fetch.js";
import { dataCache } from "./cache.js";
import type { Payload } from "./types.js";
import { forecastMetricsFromSnapshotsForMonth } from "./chart-forecast.js";
import { median } from "./github-metrics.js";

/** Snapshot-based month-end projection (totals stay actual-only). */
export interface MonthlyForecastMetrics {
  prs_merged: number;
  pr_reviews: number;
  pr_comments: number;
  commits_pushed: number;
  linear_completed: number;
  linear_worked_on: number;
  linear_issues_created: number;
  prs_total: number;
  lines_added: number;
  lines_deleted: number;
  files_changed: number;
  median_review_latency_hours: number | null;
}

export interface MonthlyAggregate {
  month: string; // YYYY-MM
  label: string; // "Jan 2026"
  prs_merged: number;
  pr_reviews: number;
  pr_comments: number;
  commits_pushed: number;
  linear_completed: number;
  linear_worked_on: number;
  linear_issues_created: number;
  prs_total: number;
  lines_added: number;
  lines_deleted: number;
  files_changed: number;
  /** Average of weekly medians for the month (noted: not a true monthly median of all reviews) */
  median_review_latency_hours: number | null;
  week_count: number;
  forecast?: MonthlyForecastMetrics | null;
}

/** A project completed during the year, with the week whose summary recorded it. */
export interface ShippedProjectEntry {
  week: string;
  title: string;
  url: string | null;
  description: string | null;
  completedAt: string | null;
  startedAt: string | null;
  targetDate: string | null;
  lead: string | null;
  issue_count: number;
  completed_issue_count: number;
}

export interface AnnualData {
  year: string;
  months: MonthlyAggregate[];
  total_prs_merged: number;
  total_pr_reviews: number;
  total_pr_comments: number;
  total_commits_pushed: number;
  total_linear_completed: number;
  total_linear_worked_on: number;
  total_linear_issues_created: number;
  total_lines_added: number;
  total_lines_deleted: number;
  total_files_changed: number;
  total_projects_completed: number;
  /** Average of monthly average-of-weekly-medians */
  avg_review_latency_hours: number | null;
  topRepos: { repo: string; prs: number }[];
  topProjects: { project: string; issues: number }[];
  /** Completed projects, newest first — too few per year to chart, so listed. */
  projectsShipped: ShippedProjectEntry[];
  weeks: string[];
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export async function getAnnualData(
  year: string,
  options?: { bust?: boolean }
): Promise<AnnualData> {
  const bust = options?.bust ?? false;
  const key = `charts:annual:${year}`;
  if (!bust) {
    const cached = dataCache.get(key) as AnnualData | null;
    if (cached) return cached;
  }

  const weeks = await listWeeklySummaries({ bust });
  const yearWeeks = weeks.filter((w) => w.startsWith(year));
  const results = await Promise.all(
    yearWeeks.map(async (week) => ({
      week,
      payload: await fetchWeeklySummary(week, { bust }),
    }))
  );
  const payloads = results.filter(
    (r): r is { week: string; payload: Payload } => r.payload != null
  );

  const monthMap = new Map<
    string,
    {
      prs_merged: number;
      pr_reviews: number;
      pr_comments: number;
      commits_pushed: number;
      linear_completed: number;
      linear_worked_on: number;
      linear_issues_created: number;
      prs_total: number;
      lines_added: number;
      lines_deleted: number;
      files_changed: number;
      latency_weeks: number[];
      count: number;
    }
  >();
  const repoMap = new Map<string, number>();
  const projectMap = new Map<string, number>();
  const projectsShipped: ShippedProjectEntry[] = [];

  for (const { week, payload } of payloads) {
    const month = week.slice(0, 7); // YYYY-MM
    const s = payload.stats;
    const curr = monthMap.get(month) ?? {
      prs_merged: 0,
      pr_reviews: 0,
      pr_comments: 0,
      commits_pushed: 0,
      linear_completed: 0,
      linear_worked_on: 0,
      linear_issues_created: 0,
      prs_total: 0,
      lines_added: 0,
      lines_deleted: 0,
      files_changed: 0,
      latency_weeks: [] as number[],
      count: 0,
    };
    curr.prs_merged += s.prs_merged;
    curr.pr_reviews += s.pr_reviews;
    curr.pr_comments += s.pr_comments;
    curr.commits_pushed += s.commits_pushed ?? 0;
    curr.linear_completed += s.linear_completed;
    curr.linear_worked_on += s.linear_worked_on;
    curr.linear_issues_created += s.linear_issues_created ?? 0;
    curr.prs_total += s.prs_total;
    curr.lines_added += s.lines_added ?? 0;
    curr.lines_deleted += s.lines_deleted ?? 0;
    curr.files_changed += s.files_changed ?? 0;
    if (
      typeof s.median_review_latency_hours === "number" &&
      Number.isFinite(s.median_review_latency_hours)
    ) {
      curr.latency_weeks.push(s.median_review_latency_hours);
    }
    curr.count += 1;
    monthMap.set(month, curr);

    const merged = payload.github?.merged_prs ?? [];
    for (const pr of merged) {
      const repo = pr.repo ?? "unknown";
      repoMap.set(repo, (repoMap.get(repo) ?? 0) + 1);
    }

    const completed = payload.linear?.completed_issues ?? [];
    for (const i of completed) {
      const proj = (i.project as string) ?? "—";
      projectMap.set(proj, (projectMap.get(proj) ?? 0) + 1);
    }

    for (const p of payload.linear?.completed_projects ?? []) {
      projectsShipped.push({
        week,
        title: (p.title as string) ?? "",
        url: (p.url as string | null) ?? null,
        description: (p.description as string | null) ?? null,
        completedAt: (p.completedAt as string | null) ?? null,
        startedAt: (p.startedAt as string | null) ?? null,
        targetDate: (p.targetDate as string | null) ?? null,
        lead: (p.lead as string | null) ?? null,
        issue_count: typeof p.issue_count === "number" ? p.issue_count : 0,
        completed_issue_count:
          typeof p.completed_issue_count === "number"
            ? p.completed_issue_count
            : 0,
      });
    }
  }

  // Newest first; undated entries sink to the bottom rather than disappearing.
  projectsShipped.sort((a, b) =>
    (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
  );

  const months: MonthlyAggregate[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [y, m] = month.split("-").map(Number);
      const label = `${MONTH_LABELS[m - 1]} ${y}`;
      // Average of weekly medians (not a true monthly median of all reviews)
      const avgLatency =
        data.latency_weeks.length > 0
          ? Math.round(
              (data.latency_weeks.reduce((a, b) => a + b, 0) /
                data.latency_weeks.length) *
                100
            ) / 100
          : null;
      return {
        month,
        label,
        prs_merged: data.prs_merged,
        pr_reviews: data.pr_reviews,
        pr_comments: data.pr_comments,
        commits_pushed: data.commits_pushed,
        linear_completed: data.linear_completed,
        linear_worked_on: data.linear_worked_on,
        linear_issues_created: data.linear_issues_created,
        prs_total: data.prs_total,
        lines_added: data.lines_added,
        lines_deleted: data.lines_deleted,
        files_changed: data.files_changed,
        median_review_latency_hours: avgLatency,
        week_count: data.count,
      };
    });

  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (year === currentYearStr) {
    const idx = months.findIndex((m) => m.month === currentMonthStr);
    if (idx >= 0) {
      const fc = forecastMetricsFromSnapshotsForMonth(currentMonthStr, now);
      if (fc) {
        const prev = months[idx]!;
        months[idx] = {
          ...prev,
          forecast: {
            prs_merged: fc.prs_merged,
            pr_reviews: fc.pr_reviews,
            pr_comments: fc.pr_comments,
            commits_pushed: fc.commits_pushed,
            linear_completed: fc.linear_completed,
            linear_worked_on: fc.linear_worked_on,
            linear_issues_created: fc.linear_issues_created,
            prs_total: fc.prs_total,
            lines_added: fc.lines_added,
            lines_deleted: fc.lines_deleted,
            files_changed: fc.files_changed,
            median_review_latency_hours: fc.median_review_latency_hours,
          },
        };
      }
    }
  }

  const topRepos = Array.from(repoMap.entries())
    .map(([repo, prs]) => ({ repo, prs }))
    .sort((a, b) => b.prs - a.prs)
    .slice(0, 10);

  const topProjects = Array.from(projectMap.entries())
    .map(([project, issues]) => ({ project, issues }))
    .sort((a, b) => b.issues - a.issues)
    .slice(0, 10);

  const totals = months.reduce(
    (acc, m) => ({
      prs_merged: acc.prs_merged + m.prs_merged,
      pr_reviews: acc.pr_reviews + m.pr_reviews,
      pr_comments: acc.pr_comments + m.pr_comments,
      commits_pushed: acc.commits_pushed + m.commits_pushed,
      linear_completed: acc.linear_completed + m.linear_completed,
      linear_worked_on: acc.linear_worked_on + m.linear_worked_on,
      linear_issues_created:
        acc.linear_issues_created + m.linear_issues_created,
      lines_added: acc.lines_added + m.lines_added,
      lines_deleted: acc.lines_deleted + m.lines_deleted,
      files_changed: acc.files_changed + m.files_changed,
    }),
    {
      prs_merged: 0,
      pr_reviews: 0,
      pr_comments: 0,
      commits_pushed: 0,
      linear_completed: 0,
      linear_worked_on: 0,
      linear_issues_created: 0,
      lines_added: 0,
      lines_deleted: 0,
      files_changed: 0,
    }
  );

  const monthLatencies = months
    .map((m) => m.median_review_latency_hours)
    .filter((h): h is number => typeof h === "number");

  const result = {
    year,
    months,
    total_prs_merged: totals.prs_merged,
    total_pr_reviews: totals.pr_reviews,
    total_pr_comments: totals.pr_comments,
    total_commits_pushed: totals.commits_pushed,
    total_linear_completed: totals.linear_completed,
    total_linear_worked_on: totals.linear_worked_on,
    total_linear_issues_created: totals.linear_issues_created,
    total_lines_added: totals.lines_added,
    total_lines_deleted: totals.lines_deleted,
    total_files_changed: totals.files_changed,
    total_projects_completed: projectsShipped.length,
    avg_review_latency_hours: median(monthLatencies),
    topRepos,
    topProjects,
    projectsShipped,
    weeks: yearWeeks.sort(),
  };
  dataCache.set(key, result);
  return result;
}

export async function getAvailableYears(options?: {
  bust?: boolean;
}): Promise<string[]> {
  const bust = options?.bust ?? false;
  const key = "charts:years";
  if (!bust) {
    const cached = dataCache.get(key) as string[] | null;
    if (cached) return cached;
  }

  const weeks = await listWeeklySummaries({ bust });
  const years = new Set(weeks.map((w) => w.slice(0, 4)));
  const result = [...years].sort((a, b) => b.localeCompare(a));
  dataCache.set(key, result);
  return result;
}
