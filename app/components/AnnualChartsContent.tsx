/**
 * Annual dashboard charts - monthly aggregates.
 */
import { AreaChart } from "@tremor/react";

interface MonthlyPoint {
  month: string;
  label: string;
  prs_merged: number;
  pr_reviews: number;
  pr_comments: number;
  commits_pushed: number;
  linear_completed: number;
  linear_worked_on: number;
}

interface AnnualChartsContentProps {
  months: MonthlyPoint[];
}

export function AnnualChartsContent({ months }: AnnualChartsContentProps) {
  const data = months.map((m) => ({
    month: m.label,
    "PRs merged": m.prs_merged,
    "PR reviews": m.pr_reviews,
    "PR comments": m.pr_comments,
    "Commits pushed": m.commits_pushed,
    "Linear completed": m.linear_completed,
    "Linear worked on": m.linear_worked_on,
  }));

  return (
    <div className="dark">
      <div className="h-72 min-w-0 overflow-x-auto" role="img" aria-label="Area chart showing monthly PRs and Linear metrics">
        <AreaChart
          data={data}
          index="month"
          categories={["PRs merged", "PR reviews", "PR comments", "Commits pushed", "Linear completed", "Linear worked on"]}
          colors={["violet", "cyan", "blue", "indigo", "emerald", "amber"]}
          valueFormatter={(v) => String(v ?? 0)}
          yAxisWidth={40}
          showAnimation
          className="h-full"
        />
      </div>
    </div>
  );
}
