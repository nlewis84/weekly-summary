/**
 * Aggregate weekly data by year for annual dashboard.
 */

import { listWeeklySummaries, fetchWeeklySummary } from "./github-fetch.js";
import { dataCache } from "./cache.js";
import type { Payload } from "./types.js";

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
  week_count: number;
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
  topRepos: { repo: string; prs: number }[];
  topProjects: { project: string; issues: number }[];
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
      count: number;
    }
  >();
  const repoMap = new Map<string, number>();
  const projectMap = new Map<string, number>();

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
  }

  const months: MonthlyAggregate[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const [y, m] = month.split("-").map(Number);
      const label = `${MONTH_LABELS[m - 1]} ${y}`;
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
        week_count: data.count,
      };
    });

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
    }),
    {
      prs_merged: 0,
      pr_reviews: 0,
      pr_comments: 0,
      commits_pushed: 0,
      linear_completed: 0,
      linear_worked_on: 0,
      linear_issues_created: 0,
    }
  );

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
    topRepos,
    topProjects,
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
