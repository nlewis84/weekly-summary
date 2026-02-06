/**
 * Chart components (Tremor) - loaded lazily to reduce initial Charts route chunk.
 */
import { AreaChart, BarChart } from "@tremor/react";

const formatWeek = (w: string) => {
  const d = new Date(w);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

interface ChartsContentProps {
  dataPoints: { week_ending: string; prs_merged: number; pr_reviews: number; pr_comments: number; commits_pushed: number; linear_completed: number; linear_worked_on: number; prs_total: number; repos_count: number }[];
  repoActivity: { repo: string; total_prs: number }[];
}

export function ChartsContent({ dataPoints, repoActivity }: ChartsContentProps) {
  const metricsData = dataPoints.map((d) => ({
    week: formatWeek(d.week_ending),
    "PRs merged": d.prs_merged,
    "PR reviews": d.pr_reviews,
    "PR comments": d.pr_comments,
    "Commits pushed": d.commits_pushed,
    "Linear completed": d.linear_completed,
    "Linear worked on": d.linear_worked_on,
    "PRs total": d.prs_total,
    Repos: d.repos_count,
  }));

  const reposData = repoActivity.slice(0, 10).map((r) => ({
    name: r.repo.split("/").pop() ?? r.repo,
    "PRs merged": r.total_prs,
  }));

  return (
    <div className="dark">
      <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)] p-4 sm:p-6 overflow-hidden">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">PRs & Linear</h3>
        <div className="h-72 min-w-0 overflow-x-auto" role="img" aria-label="Area chart showing PRs merged, PR reviews, PR comments, Linear completed, and Linear worked on over time">
          <AreaChart
            data={metricsData}
            index="week"
            categories={["PRs merged", "PR reviews", "PR comments", "Commits pushed", "Linear completed", "Linear worked on"]}
            colors={["violet", "cyan", "blue", "indigo", "emerald", "amber"]}
            valueFormatter={(v) => String(v ?? 0)}
            yAxisWidth={40}
            showAnimation
            className="h-full"
          />
        </div>
      </div>

      <div className="mt-6 bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)] p-4 sm:p-6 overflow-hidden">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Repos (PRs per week)</h3>
        <div className="h-72 min-w-0 overflow-x-auto" role="img" aria-label="Bar chart showing PRs merged per repository">
          <BarChart
            data={reposData}
            index="name"
            categories={["PRs merged"]}
            colors={["violet", "cyan", "emerald"]}
            layout="vertical"
            valueFormatter={(v) => String(v ?? 0)}
            yAxisWidth={48}
            showAnimation
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
