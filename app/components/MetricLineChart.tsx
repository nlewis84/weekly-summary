/**
 * Reusable line chart for a single metric over time (week or month).
 */
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "~/components/ui/chart";

interface MetricLineChartProps {
  data: { x: string; value: number }[];
  metricKey: string;
  color: string;
  xKey?: string;
  ariaLabel: string;
}

export function MetricLineChart({
  data,
  metricKey,
  color,
  xKey = "x",
  ariaLabel,
}: MetricLineChartProps) {
  const chartData = data.map((d) => ({ [xKey]: d.x, [metricKey]: d.value }));
  const config = { [metricKey]: { label: metricKey, color } } satisfies ChartConfig;

  return (
    <div className="h-48 min-w-0" role="img" aria-label={ariaLabel}>
      <ChartContainer config={config} className="h-full w-full min-h-[192px]">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 40, bottom: 0 }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
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
          <Line
            dataKey={metricKey}
            type="monotone"
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 3 }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
