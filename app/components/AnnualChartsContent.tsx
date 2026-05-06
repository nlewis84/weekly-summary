/**
 * Annual dashboard charts - monthly aggregates (shadcn/Recharts).
 * Small-multiples: one line chart per metric.
 */
import { MetricLineChart } from "~/components/MetricLineChart";
import type {
  MonthlyAggregate,
  MonthlyForecastMetrics,
} from "../../lib/annual-data";

const METRICS = [
  { key: "PRs merged", color: "var(--chart-1)", sumKey: "prs_merged" as const },
  { key: "PR reviews", color: "var(--chart-2)", sumKey: "pr_reviews" as const },
  { key: "PR comments", color: "var(--chart-3)", sumKey: "pr_comments" as const },
  {
    key: "Commits pushed",
    color: "var(--chart-4)",
    sumKey: "commits_pushed" as const,
  },
  {
    key: "Linear completed",
    color: "var(--chart-5)",
    sumKey: "linear_completed" as const,
  },
  {
    key: "Linear worked on",
    color: "var(--chart-6)",
    sumKey: "linear_worked_on" as const,
  },
  {
    key: "Linear issues created",
    color: "var(--chart-7)",
    sumKey: "linear_issues_created" as const,
  },
] as const;

interface AnnualChartsContentProps {
  months: MonthlyAggregate[];
}

function rowFromMonth(m: MonthlyAggregate) {
  return {
    month: m.label,
    "PRs merged": m.prs_merged,
    "PR reviews": m.pr_reviews,
    "PR comments": m.pr_comments,
    "Commits pushed": m.commits_pushed,
    "Linear completed": m.linear_completed,
    "Linear worked on": m.linear_worked_on,
    "Linear issues created": m.linear_issues_created,
  };
}

export function AnnualChartsContent({ months }: AnnualChartsContentProps) {
  const last = months[months.length - 1];
  const hasForecast = !!last?.forecast;
  const solidMonths = hasForecast ? months.slice(0, -1) : months;
  const data = solidMonths.map(rowFromMonth);

  const monthForecast = (
    sumKey: keyof MonthlyForecastMetrics
  ): { x: string; value: number } | null =>
    hasForecast && last?.forecast
      ? { x: last.label, value: last.forecast[sumKey] }
      : null;

  return (
    <div>
      {hasForecast ? (
        <p className="text-xs text-text-muted mb-3">
          Dashed segment on the current month is a snapshot-based forecast.
        </p>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRICS.map(({ key, color, sumKey }) => (
          <div
            key={key}
            className="bg-surface-elevated rounded-lg border border-(--color-border) p-3"
          >
            <h4 className="text-xs font-medium text-text-muted mb-2 truncate">
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
              forecast={monthForecast(sumKey)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
