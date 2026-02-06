/**
 * Chart components (shadcn/Recharts) - loaded lazily to reduce initial Charts route chunk.
 */
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "~/components/ui/chart";
import { MetricLineChart } from "~/components/MetricLineChart";
import type { RepoActivity } from "../../lib/charts-data";

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

const REPO_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

const reposBarConfig = {
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
  repoActivity: RepoActivity[];
}

type ReposView = "most-active" | "over-time";

export function ChartsContent({ dataPoints, repoActivity }: ChartsContentProps) {
  const [reposView, setReposView] = useState<ReposView>("most-active");

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

  const topRepos = repoActivity.slice(0, 6);
  const reposBarData = repoActivity.slice(0, 10).map((r) => ({
    name: r.repo.split("/").pop() ?? r.repo,
    "PRs merged": r.total_prs,
  }));

  // Build over-time data: { weekLabel, repo1: n, repo2: n, ... } for top 6 repos
  const reposOverTimeData = sorted.map((d) => {
    const row: Record<string, number | string> = {
      weekLabel: formatWeek(d.week_ending),
    };
    for (const r of topRepos) {
      const shortName = r.repo.split("/").pop() ?? r.repo;
      const weekEntry = r.weeks.find((we: { week_ending: string; prs: number }) => we.week_ending === d.week_ending);
      row[shortName] = weekEntry?.prs ?? 0;
    }
    return row;
  });

  const reposLineConfig = topRepos.reduce(
    (acc, r, i) => {
      const shortName = r.repo.split("/").pop() ?? r.repo;
      acc[shortName] = { label: shortName, color: REPO_COLORS[i % REPO_COLORS.length] };
      return acc;
    },
    {} as Record<string, { label: string; color: string }>
  ) satisfies ChartConfig;

  const reposChartHeight = Math.max(200, Math.min(400, reposBarData.length * 36 + 80));

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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-medium text-[var(--color-text)]">
            Most Active Repos
          </h3>
          <div
            role="tablist"
            aria-label="Repos chart view"
            className="flex rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-surface-elevated)]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={reposView === "most-active"}
              aria-controls="repos-chart-panel"
              id="repos-tab-most-active"
              onClick={() => setReposView("most-active")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                reposView === "most-active"
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Most active
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={reposView === "over-time"}
              aria-controls="repos-chart-panel"
              id="repos-tab-over-time"
              onClick={() => setReposView("over-time")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                reposView === "over-time"
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Over time
            </button>
          </div>
        </div>
        <div
          id="repos-chart-panel"
          role="tabpanel"
          aria-labelledby={reposView === "most-active" ? "repos-tab-most-active" : "repos-tab-over-time"}
          className="min-w-0 overflow-x-auto"
          style={{ minHeight: reposView === "most-active" ? reposChartHeight : 240 }}
        >
          {reposView === "most-active" ? (
            <div
              role="img"
              aria-label="Bar chart showing total PRs merged per repository"
            >
              <ChartContainer
                config={reposBarConfig}
                className="h-full w-full min-h-[200px]"
              >
                <BarChart
                  data={reposBarData}
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
          ) : (
            <div
              role="img"
              aria-label="Line chart showing PRs merged per repository over time"
            >
              <ChartContainer
                config={reposLineConfig}
                className="h-full w-full min-h-[200px]"
              >
                <LineChart
                  data={reposOverTimeData}
                  margin={{ top: 8, right: 8, left: 40, bottom: 0 }}
                  accessibilityLayer
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="weekLabel"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    domain={[0, "auto"]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={36}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {topRepos.map((r, i) => {
                    const shortName = r.repo.split("/").pop() ?? r.repo;
                    return (
                      <Line
                        key={r.repo}
                        dataKey={shortName}
                        type="monotone"
                        stroke={REPO_COLORS[i % REPO_COLORS.length]}
                        strokeWidth={2}
                        dot={{ fill: REPO_COLORS[i % REPO_COLORS.length], r: 3 }}
                        activeDot={{ r: 4 }}
                      />
                    );
                  })}
                </LineChart>
              </ChartContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
