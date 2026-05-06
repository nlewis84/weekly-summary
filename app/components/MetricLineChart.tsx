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

const FORECAST_DASH_KEY = "forecastDash";

/** Solid history line draw time; forecast dash starts after this + gap. */
const HISTORY_ANIM_MS = 480;
const FORECAST_ANIM_GAP_MS = 60;
const FORECAST_ANIM_MS = 360;

/** Single interior sample on Hermite curve (t=0 last actual, t=1 forecast). Fewer points = smoother dash, less “faceted” look. */
const FORECAST_HERMITE_SAMPLES = [0.5] as const;

/**
 * Cubic Hermite on t ∈ [0,1]: p(0)=p0, p(1)=p1, p'(0)=m0, p'(1)=m1 (derivatives w.r.t. t).
 * Lets the dashed path leave the last solid point with the same step slope as history.
 */
function cubicHermiteY(
  t: number,
  p0: number,
  p1: number,
  m0: number,
  m1: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p0 +
    (t3 - 2 * t2 + t) * m0 +
    (-2 * t3 + 3 * t2) * p1 +
    (t3 - t2) * m1
  );
}

/** Unique categorical x for interior forecast samples (hidden on axis). */
function forecastBridgeX(i: number): string {
  return `\u2060${i}\u2060`;
}

function isForecastBridgeTick(v: unknown): boolean {
  return typeof v === "string" && /^\u2060[0-9]+\u2060$/.test(v);
}

export interface MetricLineChartProps {
  data: { x: string; value: number }[];
  metricKey: string;
  color: string;
  xKey?: string;
  ariaLabel: string;
  /** Optional end point: dashed segment from last actual to this (projected) value */
  forecast?: { x: string; value: number } | null;
}

export function MetricLineChart({
  data,
  metricKey,
  color,
  xKey = "x",
  ariaLabel,
  forecast,
}: MetricLineChartProps) {
  const hasForecast =
    forecast != null &&
    Number.isFinite(forecast.value) &&
    forecast.x.length > 0;

  const showForecastDash = hasForecast && data.length > 0;

  type Row = Record<string, string | number | null | undefined>;
  let chartData: Row[];

  if (data.length === 0 && hasForecast) {
    chartData = [
      {
        [xKey]: forecast!.x,
        [metricKey]: forecast!.value,
        [FORECAST_DASH_KEY]: undefined,
      },
    ];
  } else if (showForecastDash) {
    chartData = data.map((d) => ({
      [xKey]: d.x,
      [metricKey]: d.value,
      [FORECAST_DASH_KEY]: undefined as number | undefined,
    }));
    const last = data[data.length - 1]!;
    const lastRow = chartData[chartData.length - 1]!;
    lastRow[FORECAST_DASH_KEY] = last.value;

    const yN = last.value;
    const yF = forecast!.value;
    const yPrev = data.length >= 2 ? data[data.length - 2]!.value : yN;
    const m0 = yN - yPrev;
    const chord = Math.max(Math.abs(yF - yN), 1);
    const m1 = Math.max(-chord * 2.5, Math.min(chord * 2.5, yF - yN));

    let i = 0;
    for (const t of FORECAST_HERMITE_SAMPLES) {
      const y = Math.max(0, Math.round(cubicHermiteY(t, yN, yF, m0, m1)));
      chartData.push({
        [xKey]: forecastBridgeX(i++),
        [metricKey]: null,
        [FORECAST_DASH_KEY]: y,
      });
    }
    chartData.push({
      [xKey]: forecast!.x,
      [metricKey]: null,
      [FORECAST_DASH_KEY]: yF,
    });
  } else {
    chartData = data.map((d) => ({
      [xKey]: d.x,
      [metricKey]: d.value,
      [FORECAST_DASH_KEY]: undefined,
    }));
  }

  const config = {
    [metricKey]: { label: metricKey, color },
    [FORECAST_DASH_KEY]: {
      label: "Forecast",
      color,
    },
  } satisfies ChartConfig;

  const avgSource =
    data.length > 0
      ? data
      : hasForecast
        ? [{ x: forecast!.x, value: forecast!.value }]
        : [];
  const avg =
    avgSource.length > 0
      ? avgSource.reduce((sum, d) => sum + d.value, 0) / avgSource.length
      : 0;
  const avgDisplay = Number.isInteger(avg) ? avg.toString() : avg.toFixed(1);

  const forecastX = hasForecast ? forecast!.x : null;

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
            tickFormatter={(v) => (isForecastBridgeTick(v) ? "" : String(v))}
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
              const row = payload[0]?.payload as Row | undefined;
              const isBridge = isForecastBridgeTick(label);
              const isFcRow =
                forecastX != null &&
                label === forecastX &&
                row?.[metricKey] == null &&
                row?.[FORECAST_DASH_KEY] != null;
              const value = (isFcRow || isBridge
                ? row![FORECAST_DASH_KEY]
                : payload[0]?.value) as number;
              return (
                <div className="rounded-lg border border-(--color-border) bg-surface px-3 py-2 shadow-md text-center">
                  <p className="text-xs text-text-muted mb-1">
                    {isBridge ? "Forecast" : label}
                  </p>
                  <p className="text-base font-semibold text-(--color-text)">
                    {value}
                  </p>
                  {isFcRow ? (
                    <p className="text-xs text-text-muted mt-0.5">Forecast</p>
                  ) : isBridge ? null : (
                    <p className="text-xs text-text-muted mt-0.5">
                      avg {avgDisplay}
                    </p>
                  )}
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
            connectNulls={false}
            {...(showForecastDash
              ? {
                  animationDuration: HISTORY_ANIM_MS,
                  animationBegin: 0,
                }
              : {})}
          />
          {showForecastDash && (
            <Line
              dataKey={FORECAST_DASH_KEY}
              type="monotone"
              stroke={color}
              strokeWidth={2}
              strokeDasharray="5 5"
              strokeOpacity={0.75}
              strokeLinecap="butt"
              strokeLinejoin="miter"
              dot={false}
              activeDot={false}
              connectNulls
              legendType="none"
              name="Forecast"
              animationDuration={FORECAST_ANIM_MS}
              animationBegin={HISTORY_ANIM_MS + FORECAST_ANIM_GAP_MS}
            />
          )}
        </LineChart>
      </ChartContainer>
    </div>
  );
}
