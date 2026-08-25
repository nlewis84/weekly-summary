/**
 * Month-to-date merged PRs against the standing monthly target, stacked for the
 * right rail: hero and meter, the month's burn-up, the pace figures, then where
 * the merges landed. The card, header, and period toggle belong to
 * PeriodSummaryCard — the status pill is built from `monthlyStatus` so the
 * header can show it only while the month is the selected period.
 */

import {
  Area,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle,
  TrendUp,
  TrendDown,
  Equals,
  type Icon,
} from "phosphor-react";
import { ChartContainer, ChartTooltip, type ChartConfig } from "~/components/ui/chart";
import { formatNumber } from "~/lib/utils";
import {
  computePace,
  type MonthlyProgress,
  type PaceSummary,
} from "../../lib/monthly-pace";

interface MonthlyProgressBodyProps {
  progress: MonthlyProgress;
  target: number;
}

const SERIES_COLOR = "var(--color-primary-500)";

/** Day-of-month ticks — enough to orient without crowding the axis. */
const X_TICKS = [1, 5, 10, 15, 20, 25, 30];

type Status = PaceSummary["status"];

export const MONTHLY_STATUS: Record<
  Status,
  { label: string; Icon: Icon; pill: string; accent: string; meter: string }
> = {
  met: {
    label: "Target met",
    Icon: CheckCircle,
    pill: "bg-success-bg border-success-border text-success-500",
    accent: "text-success-500",
    meter: "bg-success-500",
  },
  ahead: {
    label: "Ahead of pace",
    Icon: TrendUp,
    pill: "bg-success-bg border-success-border text-success-500",
    accent: "text-success-500",
    meter: "bg-success-500",
  },
  "on-pace": {
    label: "On pace",
    Icon: Equals,
    pill: "bg-surface-elevated border-(--color-border) text-text-muted",
    accent: "text-(--color-text)",
    meter: "bg-primary-500",
  },
  behind: {
    label: "Behind pace",
    Icon: TrendDown,
    pill: "bg-error-bg border-error-border text-error-500",
    accent: "text-error-500",
    meter: "bg-error-500",
  },
};

const CHART_CONFIG = {
  actual: { label: "Merged", color: SERIES_COLOR },
  pace: { label: "Even pace", color: "var(--color-text-muted)" },
} satisfies ChartConfig;

interface ChartRow {
  day: string;
  date: string;
  actual: number | null;
  pace: number;
}

function buildRows(progress: MonthlyProgress, target: number): ChartRow[] {
  const total = progress.businessDaysInMonth;
  let elapsed = 0;
  return progress.days.map((d) => {
    if (d.isBusinessDay) elapsed += 1;
    return {
      day: String(d.day),
      date: d.date,
      actual: d.cumulative,
      pace: total > 0 ? Math.round(((target * elapsed) / total) * 10) / 10 : 0,
    };
  });
}

function formatDayLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Smallest "nice" axis top at or above the data plus headroom. Rounding to a
 * multiple of 5 was not enough — 135 divides into ticks of 35, 35, 35, 30.
 */
function niceMax(raw: number): number {
  const wanted = Math.max(raw, 1) * 1.12;
  const pow = 10 ** Math.floor(Math.log10(wanted));
  for (const step of [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5]) {
    if (step * pow >= wanted) return step * pow;
  }
  return 10 * pow;
}

function formatPace(value: number): string {
  return Number.isInteger(value)
    ? formatNumber(value)
    : value.toLocaleString("en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      });
}

function StatRow({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-right min-w-0">
        <span
          className={`text-sm font-semibold tabular-nums ${tone ?? "text-(--color-text)"}`}
        >
          {value}
        </span>
        {hint && (
          <span className="block text-xs text-text-muted leading-tight">
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}

function LegendKey({
  children,
  swatch,
}: {
  children: React.ReactNode;
  swatch: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-text-muted">
      {swatch}
      {children}
    </span>
  );
}

/** Status metadata for a month/target pair — drives the header pill. */
export function monthlyStatus(progress: MonthlyProgress, target: number) {
  const pace = computePace(progress, target);
  return { pace, status: MONTHLY_STATUS[pace.status] };
}

export function MonthlyProgressBody({
  progress,
  target,
}: MonthlyProgressBodyProps) {
  const { pace, status } = monthlyStatus(progress, target);
  const rows = buildRows(progress, target);
  const fillPct = Math.min(100, pace.pct);
  const monthEnd = formatDayLabel(
    `${progress.month}-${String(progress.daysInMonth).padStart(2, "0")}`
  );
  const topRepoMax = Math.max(1, ...progress.topRepos.map((r) => r.count));
  const otherRepoCount =
    progress.merged - progress.topRepos.reduce((sum, r) => sum + r.count, 0);
  const yMax = niceMax(Math.max(pace.target, progress.merged));

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline gap-2">
          {/* Proportional figures: tabular-nums looks loose at hero size. */}
          <span
            className={`text-4xl font-semibold leading-none ${status.accent}`}
          >
            {formatNumber(progress.merged)}
          </span>
          <span className="text-sm text-text-muted">
            of {formatNumber(pace.target)} merged in {progress.label}
          </span>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-primary-500/15 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${status.meter}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-text-muted tabular-nums">
          {pace.pct}% of target
        </p>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pb-2">
          <LegendKey
            swatch={
              <span
                className="w-3 h-0.5 rounded-full"
                style={{ background: SERIES_COLOR }}
              />
            }
          >
            Merged, cumulative
          </LegendKey>
          <LegendKey
            swatch={
              <span className="w-3 border-t border-dashed border-text-muted" />
            }
          >
            Even pace
          </LegendKey>
        </div>

        <div
          className="h-44 min-w-0"
          role="img"
          aria-label={`Cumulative merged PRs for ${progress.label}: ${progress.merged} of ${pace.target} through ${formatDayLabel(progress.through)}, ${status.label.toLowerCase()}.`}
        >
          <ChartContainer
            config={CHART_CONFIG}
            className="h-full w-full min-h-[176px] aspect-auto"
          >
            <ComposedChart
              data={rows}
              margin={{ top: 8, right: 10, left: 0, bottom: 0 }}
              accessibilityLayer
            >
              <defs>
                <linearGradient
                  id="monthlyActualFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={SERIES_COLOR}
                    stopOpacity={0.16}
                  />
                  <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                ticks={X_TICKS.filter((t) => t <= progress.daysInMonth).map(
                  String
                )}
              />
              <YAxis
                domain={[0, yMax]}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                width={32}
                tickCount={4}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload as ChartRow | undefined;
                  if (!row) return null;
                  const dayCount =
                    progress.days.find((d) => d.date === row.date)?.merged ?? 0;
                  return (
                    <div className="rounded-lg border border-(--color-border) bg-surface px-3 py-2 shadow-md">
                      <p className="text-xs text-text-muted mb-1">
                        {formatDayLabel(row.date)}
                      </p>
                      {row.actual == null ? (
                        <p className="text-sm text-text-muted">No data yet</p>
                      ) : (
                        <p className="text-base font-semibold text-(--color-text) tabular-nums">
                          {formatNumber(row.actual)}
                          <span className="text-xs font-normal text-text-muted ml-1.5">
                            merged so far
                          </span>
                        </p>
                      )}
                      {row.actual != null && dayCount > 0 && (
                        <p className="text-xs text-text-muted tabular-nums mt-0.5">
                          +{formatNumber(dayCount)} that day
                        </p>
                      )}
                      <p className="text-xs text-text-muted tabular-nums mt-0.5">
                        Even pace {formatPace(row.pace)}
                      </p>
                    </div>
                  );
                }}
              />
              {/* References under the data: the wash keeps them readable. */}
              <ReferenceLine
                y={pace.target}
                stroke="var(--color-text-muted)"
                strokeWidth={1}
                strokeOpacity={0.7}
                label={{
                  value: `Target ${pace.target}`,
                  position: "insideTopLeft",
                  fill: "var(--color-text-muted)",
                  fontSize: 11,
                  offset: 6,
                }}
              />
              <Line
                dataKey="pace"
                type="linear"
                stroke="var(--color-text-muted)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                strokeOpacity={0.85}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
              <Area
                dataKey="actual"
                type="monotone"
                stroke={SERIES_COLOR}
                strokeWidth={2}
                strokeLinecap="round"
                fill="url(#monthlyActualFill)"
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: "var(--color-surface)",
                  strokeWidth: 2,
                }}
                connectNulls={false}
                animationDuration={480}
              />
              {progress.merged > 0 && (
                <ReferenceDot
                  x={String(Number(progress.through.slice(-2)))}
                  y={progress.merged}
                  r={4}
                  fill={SERIES_COLOR}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                  isFront
                  label={{
                    value: formatNumber(progress.merged),
                    position: "top",
                    fill: "var(--color-text)",
                    fontSize: 12,
                    fontWeight: 600,
                    offset: 8,
                  }}
                />
              )}
            </ComposedChart>
          </ChartContainer>
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-(--color-border)">
        <StatRow
          label="Pace to date"
          value={formatPace(pace.expected)}
          hint={`expected by ${progress.isCurrentMonth ? "today" : "month end"}`}
        />
        <StatRow
          label="Projected"
          value={formatNumber(pace.projected)}
          hint={`at this rate, by ${monthEnd}`}
        />
        {pace.remaining > 0 ? (
          <StatRow
            label="Needed"
            value={formatNumber(pace.remaining)}
            tone={status.accent}
            hint={
              pace.perDayNeeded != null
                ? `${formatPace(pace.perDayNeeded)}/day over ${pace.businessDaysLeft} ${pace.businessDaysLeft === 1 ? "workday" : "workdays"}`
                : "no workdays left"
            }
          />
        ) : (
          <StatRow
            label="Over target"
            value={`+${formatNumber(progress.merged - pace.target)}`}
            tone={status.accent}
            hint={`${pace.businessDaysLeft} ${pace.businessDaysLeft === 1 ? "workday" : "workdays"} left`}
          />
        )}
      </div>

      <div className="pt-3 border-t border-(--color-border)">
        <h3 className="text-xs font-medium text-text-muted pb-2">
          Where they landed
        </h3>
        {progress.topRepos.length > 0 ? (
          <ul className="space-y-2">
            {progress.topRepos.map(({ repo, count }) => (
              <li key={repo} className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span
                    className="text-xs text-(--color-text) truncate"
                    title={repo}
                  >
                    {repo}
                  </span>
                  <span className="text-xs text-text-muted tabular-nums shrink-0">
                    {formatNumber(count)}
                  </span>
                </div>
                {/* Magnitude across one measure, so one hue — the bar is
                    scaled against the busiest repo, not the target. */}
                <div className="mt-1 h-1 rounded-full bg-primary-500/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500"
                    style={{
                      width: `${Math.max(4, Math.round((count / topRepoMax) * 100))}%`,
                    }}
                  />
                </div>
              </li>
            ))}
            {otherRepoCount > 0 && (
              <li className="text-xs text-text-muted pt-0.5">
                +{formatNumber(otherRepoCount)} in other repos
              </li>
            )}
          </ul>
        ) : (
          <p className="text-xs text-text-muted">No merges yet this month.</p>
        )}
      </div>
    </div>
  );
}
