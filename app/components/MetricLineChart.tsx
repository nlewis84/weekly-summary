/**
 * Reusable line chart for a single metric over time (week or month).
 */
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
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

  const avg =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.value, 0) / data.length
      : 0;
  const avgDisplay = Number.isInteger(avg) ? avg.toString() : avg.toFixed(1);

  return (
    <div className="h-56 min-w-0" role="img" aria-label={ariaLabel}>
      <ChartContainer config={config} className="h-full w-full min-h-[224px]">
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
          <ChartTooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const value = payload[0].value as number;
              return (
                <div className="rounded-lg border border-(--color-border) bg-surface px-3 py-2 shadow-md text-center">
                  <p className="text-xs text-text-muted mb-1">{label}</p>
                  <p className="text-base font-semibold text-(--color-text)">{value}</p>
                  <p className="text-xs text-text-muted mt-0.5">avg {avgDisplay}</p>
                </div>
              );
            }}
          />
          {avg > 0 && (
            <ReferenceLine
              y={avg}
              stroke="var(--color-text-muted)"
              strokeDasharray="6 4"
              strokeWidth={1}
              strokeOpacity={0.4}
            />
          )}
          <Line
            dataKey={metricKey}
            type="monotone"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ChartContainer>
    </div>
  );
}
