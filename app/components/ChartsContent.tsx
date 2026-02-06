/**
 * Chart components (shadcn/Recharts) - loaded lazily to reduce initial Charts route chunk.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";

const formatWeek = (w: string) => {
  const d = new Date(w);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const metricsChartConfig = {
  "PRs merged": { label: "PRs merged", color: "var(--chart-1)" },
  "PR reviews": { label: "PR reviews", color: "var(--chart-2)" },
  "PR comments": { label: "PR comments", color: "var(--chart-3)" },
  "Commits pushed": { label: "Commits pushed", color: "var(--chart-4)" },
  "Linear completed": { label: "Linear completed", color: "var(--chart-5)" },
  "Linear worked on": { label: "Linear worked on", color: "hsl(252, 70%, 65%)" },
} satisfies ChartConfig;

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
  const metricsData = dataPoints.map((d) => ({
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

  return (
    <div>
      <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)] p-4 sm:p-6 overflow-hidden">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">
          PRs & Linear
        </h3>
        <div
          className="h-72 min-w-0 overflow-x-auto"
          role="img"
          aria-label="Area chart showing PRs merged, PR reviews, PR comments, Commits pushed, Linear completed, and Linear worked on over time"
        >
          <ChartContainer
            config={metricsChartConfig}
            className="h-full w-full min-h-[288px]"
          >
            <AreaChart
              data={metricsData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              accessibilityLayer
            >
              <defs>
                <linearGradient id="fillPRsMerged" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.8}
                  />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillPRReviews" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-2)"
                    stopOpacity={0.8}
                  />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillPRComments" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-3)"
                    stopOpacity={0.8}
                  />
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillCommits" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-4)"
                    stopOpacity={0.8}
                  />
                  <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillLinearCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-5)"
                    stopOpacity={0.8}
                  />
                  <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillLinearWorked" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(252, 70%, 65%)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(252, 70%, 65%)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                dataKey="PRs merged"
                type="monotone"
                stackId="a"
                fill="url(#fillPRsMerged)"
                stroke="var(--chart-1)"
              />
              <Area
                dataKey="PR reviews"
                type="monotone"
                stackId="a"
                fill="url(#fillPRReviews)"
                stroke="var(--chart-2)"
              />
              <Area
                dataKey="PR comments"
                type="monotone"
                stackId="a"
                fill="url(#fillPRComments)"
                stroke="var(--chart-3)"
              />
              <Area
                dataKey="Commits pushed"
                type="monotone"
                stackId="a"
                fill="url(#fillCommits)"
                stroke="var(--chart-4)"
              />
              <Area
                dataKey="Linear completed"
                type="monotone"
                stackId="a"
                fill="url(#fillLinearCompleted)"
                stroke="var(--chart-5)"
              />
              <Area
                dataKey="Linear worked on"
                type="monotone"
                stackId="a"
                fill="url(#fillLinearWorked)"
                stroke="hsl(252, 70%, 65%)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      <div className="mt-6 bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)] p-4 sm:p-6 overflow-hidden">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">
          Repos (PRs per week)
        </h3>
        <div
          className="h-72 min-w-0 overflow-x-auto"
          role="img"
          aria-label="Bar chart showing PRs merged per repository"
        >
          <ChartContainer
            config={reposChartConfig}
            className="h-full w-full min-h-[288px]"
          >
            <BarChart
              data={reposData}
              layout="vertical"
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              accessibilityLayer
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={80}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="PRs merged"
                fill="var(--chart-1)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
