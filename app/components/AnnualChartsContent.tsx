/**
 * Annual dashboard charts - monthly aggregates (shadcn/Recharts).
 * Small-multiples: one line chart per metric.
 */
import { MetricLineChart } from "~/components/MetricLineChart";

const METRICS = [
  { key: "PRs merged", color: "var(--chart-1)" },
  { key: "PR reviews", color: "var(--chart-2)" },
  { key: "PR comments", color: "var(--chart-3)" },
  { key: "Commits pushed", color: "var(--chart-4)" },
  { key: "Linear completed", color: "var(--chart-5)" },
  { key: "Linear worked on", color: "var(--chart-6)" },
  { key: "Linear issues created", color: "var(--chart-7)" },
] as const;

interface MonthlyPoint {
  month: string;
  label: string;
  prs_merged: number;
  pr_reviews: number;
  pr_comments: number;
  commits_pushed: number;
  linear_completed: number;
  linear_worked_on: number;
  linear_issues_created: number;
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
    "Linear issues created": m.linear_issues_created,
  }));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {METRICS.map(({ key, color }) => (
        <div
          key={key}
          className="bg-(--color-surface-elevated) rounded-lg border border-(--color-border) p-3"
        >
          <h4 className="text-xs font-medium text-(--color-text-muted) mb-2 truncate">
            {key}
          </h4>
          <MetricLineChart
            data={data.map((d) => ({
              x: d.month,
              value: d[key as keyof typeof d] as number,
            }))}
            metricKey={key}
            color={color}
            xKey="month"
            ariaLabel={`Line chart: ${key} by month`}
          />
        </div>
      ))}
    </div>
  );
}
