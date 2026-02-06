/**
 * Annual dashboard charts - monthly aggregates (shadcn/Recharts).
 */
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";

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

const chartConfig = {
  "PRs merged": { label: "PRs merged", color: "var(--chart-1)" },
  "PR reviews": { label: "PR reviews", color: "var(--chart-2)" },
  "PR comments": { label: "PR comments", color: "var(--chart-3)" },
  "Commits pushed": { label: "Commits pushed", color: "var(--chart-4)" },
  "Linear completed": { label: "Linear completed", color: "var(--chart-5)" },
  "Linear worked on": { label: "Linear worked on", color: "hsl(252, 70%, 65%)" },
} satisfies ChartConfig;

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
    <div
      className="h-72 min-w-0 overflow-x-auto"
      role="img"
      aria-label="Area chart showing monthly PRs and Linear metrics"
    >
      <ChartContainer
        config={chartConfig}
        className="h-full w-full min-h-[288px]"
      >
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id="fillAnnualPRsMerged" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillAnnualPRReviews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillAnnualPRComments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillAnnualCommits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillAnnualLinearCompleted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-5)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--chart-5)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillAnnualLinearWorked" x1="0" y1="0" x2="0" y2="1">
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
            dataKey="month"
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
            fill="url(#fillAnnualPRsMerged)"
            stroke="var(--chart-1)"
          />
          <Area
            dataKey="PR reviews"
            type="monotone"
            stackId="a"
            fill="url(#fillAnnualPRReviews)"
            stroke="var(--chart-2)"
          />
          <Area
            dataKey="PR comments"
            type="monotone"
            stackId="a"
            fill="url(#fillAnnualPRComments)"
            stroke="var(--chart-3)"
          />
          <Area
            dataKey="Commits pushed"
            type="monotone"
            stackId="a"
            fill="url(#fillAnnualCommits)"
            stroke="var(--chart-4)"
          />
          <Area
            dataKey="Linear completed"
            type="monotone"
            stackId="a"
            fill="url(#fillAnnualLinearCompleted)"
            stroke="var(--chart-5)"
          />
          <Area
            dataKey="Linear worked on"
            type="monotone"
            stackId="a"
            fill="url(#fillAnnualLinearWorked)"
            stroke="hsl(252, 70%, 65%)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
