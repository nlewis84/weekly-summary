/**
 * Chart components (shadcn/Recharts) - loaded lazily to reduce initial Charts route chunk.
 */
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";
import { MetricLineChart } from "~/components/MetricLineChart";

const formatWeek = (w: string) => {
  const d = new Date(w);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const METRICS = [
  { key: "PRs merged", color: "var(--chart-1)" },
  { key: "PR reviews", color: "var(--chart-2)" },
  { key: "PR comments", color: "var(--chart-3)" },
  { key: "Commits pushed", color: "var(--chart-4)" },
  { key: "Linear completed", color: "var(--chart-5)" },
  { key: "Linear worked on", color: "var(--chart-6)" },
] as const;

const reposChartConfig = {
  "PRs merged": { label: "PRs merged", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface ChartsContentProps {
  dataPoints: {
    week_ending: string;
    prs_merged: number;
    pr_reviews: number;
    pr_comments: number;
    commits_pushed: number;
    linear_completed: number;
    linear_worked_on: number;
    prs_total: number;
    repos_count: number;
  }[];
  repoActivity: { repo: string; total_prs: number }[];
}

export function ChartsContent({ dataPoints, repoActivity }: ChartsContentProps) {
  const sorted = [...dataPoints].sort((a, b) => a.week_ending.localeCompare(b.week_ending));
  const metricsData = sorted.map((d) => ({
    week: formatWeek(d.week_ending),
    "PRs merged": d.prs_merged,
    "PR reviews": d.pr_reviews,
    "PR comments": d.pr_comments,
    "Commits pushed": d.commits_pushed,
    "Linear completed": d.linear_completed,
    "Linear worked on": d.linear_worked_on,
  }));

  const reposData = repoActivity.slice(0, 10).map((r) => ({
    name: r.repo.split("/").pop() ?? r.repo,
    "PRs merged": r.total_prs,
  }));

  const reposChartHeight = Math.max(200, Math.min(400, reposData.length * 36 + 80));

  return (
    <div>
      <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)] p-4 sm:p-6 overflow-hidden">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">
          PRs & Linear
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {METRICS.map(({ key, color }) => (
            <div
              key={key}
              className="bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border)] p-3"
            >
              <h4 className="text-xs font-medium text-[var(--color-text-muted)] mb-2 truncate">
                {key}
              </h4>
              <MetricLineChart
                data={metricsData.map((d) => ({
                  x: d.week,
                  value: d[key as keyof typeof d] as number,
                }))}
                metricKey={key}
                color={color}
                xKey="week"
                ariaLabel={`Line chart: ${key} over time`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)] p-4 sm:p-6 overflow-hidden">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">
          Repos (PRs per week)
        </h3>
        <div
          className="min-w-0 overflow-x-auto"
          style={{ minHeight: reposChartHeight }}
          role="img"
          aria-label="Bar chart showing PRs merged per repository"
        >
          <ChartContainer
            config={reposChartConfig}
            className="h-full w-full min-h-[200px]"
          >
            <BarChart
              data={reposData}
              layout="vertical"
              margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
              barCategoryGap="12%"
              accessibilityLayer
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="PRs merged"
                fill="var(--chart-1)"
                radius={[0, 4, 4, 0]}
              >
                <LabelList
                  dataKey="PRs merged"
                  position="right"
                  className="fill-[var(--color-text-muted)]"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
