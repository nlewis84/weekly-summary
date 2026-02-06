/**
 * Build chart data from GitHub summaries.
 * Shared by api.charts route and charts page loader.
 */

import { listWeeklySummaries, fetchWeeklySummary } from "./github-fetch.js";
import type { Payload } from "./types.js";

export interface ChartDataPoint {
  week_ending: string;
  prs_merged: number;
  pr_reviews: number;
  linear_completed: number;
  linear_worked_on: number;
  prs_total: number;
  repos_count: number;
}

export interface RepoActivity {
  repo: string;
  weeks: { week_ending: string; prs: number }[];
  total_prs: number;
}

export interface ChartsData {
  dataPoints: ChartDataPoint[];
  repoActivity: RepoActivity[];
}

export async function getChartsData(): Promise<ChartsData> {
  const weeks = await listWeeklySummaries();
  const payloads: { week_ending: string; payload: Payload }[] = [];

  for (const week of weeks) {
    const payload = await fetchWeeklySummary(week);
    if (payload) {
      payloads.push({ week_ending: week, payload });
    }
  }

  const dataPoints: ChartDataPoint[] = payloads.map(({ week_ending, payload }) => {
    const s = payload.stats;
    return {
      week_ending,
      prs_merged: s.prs_merged,
      pr_reviews: s.pr_reviews,
      linear_completed: s.linear_completed,
      linear_worked_on: s.linear_worked_on,
      prs_total: s.prs_total,
      repos_count: s.repos.length,
    };
  });

  const repoMap = new Map<string, Map<string, number>>();
  for (const { week_ending, payload } of payloads) {
    const merged = payload.github?.merged_prs ?? [];
    for (const pr of merged) {
      const repo = pr.repo ?? "unknown";
      if (!repoMap.has(repo)) repoMap.set(repo, new Map());
      const prev = repoMap.get(repo)!.get(week_ending) ?? 0;
      repoMap.get(repo)!.set(week_ending, prev + 1);
    }
  }

  const repoActivity: RepoActivity[] = Array.from(repoMap.entries())
    .map(([repo, weekMap]) => {
      const weeks = Array.from(weekMap.entries())
        .map(([week_ending, prs]) => ({ week_ending, prs }))
        .sort((a, b) => a.week_ending.localeCompare(b.week_ending));
      const total_prs = weeks.reduce((sum, w) => sum + w.prs, 0);
      return { repo, weeks, total_prs };
    })
    .sort((a, b) => b.total_prs - a.total_prs);

  return { dataPoints, repoActivity };
}
