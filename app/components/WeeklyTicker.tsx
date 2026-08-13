import {
  CalendarBlank,
  CaretUp,
  CaretDown,
  WaveSine,
  Copy,
  Package,
  Eye,
  CheckCircle,
  ArrowsClockwise,
  Folder,
  ChatCircle,
  GitCommit,
  PlusCircle,
  FilePlus,
  FileMinus,
  Files,
  Timer,
  type Icon,
} from "phosphor-react";
import { useToast } from "./Toast";
import type { Stats } from "../../lib/types";
import type { WeeklyGoals } from "../hooks/useGoals";
import { BUSINESS_HOURS_LABEL } from "../../lib/github-metrics";
import { formatNumber, formatSignedNumber } from "~/lib/utils";

interface WeeklyTickerProps {
  stats: Stats;
  prevStats?: Stats | null;
  goals?: WeeklyGoals;
}

/**
 * Which direction of change is an improvement.
 * "up" is the default; "down" for metrics where a bigger number is worse (review
 * latency); "none" for volume counts where neither direction is good or bad.
 */
type Better = "up" | "down" | "none";

function TrendBadge({ delta, better }: { delta: number; better: Better }) {
  if (delta === 0)
    return (
      <WaveSine
        size={12}
        weight="bold"
        className="text-text-muted"
        aria-label="no change"
      />
    );
  const good = better === "up" ? delta > 0 : delta < 0;
  const tone = good ? "text-success-500" : "text-error-500";
  const Caret = delta > 0 ? CaretUp : CaretDown;
  return (
    <Caret
      size={12}
      weight="bold"
      className={tone}
      aria-label={`${delta > 0 ? "+" : ""}${delta}, ${good ? "better" : "worse"}`}
    />
  );
}

function formatStatsForCopy(stats: Stats): string {
  const latency =
    stats.median_review_latency_hours != null
      ? `${stats.median_review_latency_hours}h`
      : "—";
  const parts = [
    `PRs merged: ${stats.prs_merged}`,
    `PR reviews: ${stats.pr_reviews}`,
    `PR comments: ${stats.pr_comments}`,
    `Commits pushed: ${stats.commits_pushed}`,
    `Lines added: ${stats.lines_added ?? 0}`,
    `Lines deleted: ${stats.lines_deleted ?? 0}`,
    `Files changed: ${stats.files_changed ?? 0}`,
    `Median review latency (business hrs): ${latency}`,
    `Linear completed: ${stats.linear_completed}`,
    `Linear worked on: ${stats.linear_worked_on}`,
    `Linear issues created: ${stats.linear_issues_created}`,
    `Linear replies: ${stats.linear_comments}`,
    `Repos: ${stats.repos.join(", ") || "—"}`,
  ];
  return parts.join(" | ");
}

const METRICS: {
  key: keyof Stats;
  label: string;
  tooltip?: string;
  Icon: Icon;
  format?: "hours";
  better?: Better;
}[] = [
  { key: "prs_merged", label: "PRs merged", Icon: Package },
  { key: "pr_reviews", label: "PR reviews", Icon: Eye },
  { key: "pr_comments", label: "PR comments", Icon: ChatCircle },
  { key: "commits_pushed", label: "Commits pushed", Icon: GitCommit },
  {
    key: "lines_added",
    label: "Lines added",
    Icon: FilePlus,
    better: "none",
  },
  {
    key: "lines_deleted",
    label: "Lines deleted",
    Icon: FileMinus,
    better: "none",
  },
  {
    key: "files_changed",
    label: "Files changed",
    Icon: Files,
    better: "none",
  },
  {
    key: "median_review_latency_hours",
    label: "Review time (biz hrs)",
    tooltip: `Median working hours (${BUSINESS_HOURS_LABEL}) from review request to your first review. Nights and weekends are excluded.`,
    Icon: Timer,
    format: "hours",
    better: "down",
  },
  {
    key: "linear_completed",
    label: "Linear completed",
    Icon: CheckCircle,
  },
  {
    key: "linear_worked_on",
    label: "Linear worked on",
    Icon: ArrowsClockwise,
  },
  {
    key: "linear_issues_created",
    label: "Issues created",
    Icon: PlusCircle,
  },
  {
    key: "linear_comments",
    label: "Linear replies",
    Icon: ChatCircle,
  },
];

const GOAL_METRICS = [
  { key: "prs_merged" as const, label: "PRs merged", Icon: Package },
  { key: "pr_reviews" as const, label: "PR reviews", Icon: Eye },
  {
    key: "linear_completed" as const,
    label: "Linear completed",
    Icon: CheckCircle,
  },
] as const;

const RING_SIZE = 72;
const RING_STROKE = 6;

function GoalRing({
  value,
  target,
  label,
  Icon,
}: {
  value: number;
  target: number;
  label: string;
  Icon: Icon;
}) {
  const pct = Math.min(100, (value / target) * 100);
  const met = value >= target;
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <div
        className="relative"
        style={{ width: RING_SIZE, height: RING_SIZE }}
        title={`${formatNumber(value)} of ${formatNumber(target)} ${label}`}
      >
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={RING_STROKE}
            className="text-surface-elevated"
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`transition-[stroke-dashoffset] duration-500 ${
              met
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-primary-500"
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Icon
            size={14}
            weight="regular"
            className={`mb-0.5 ${
              met
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-primary-500"
            }`}
          />
          <span className="text-xs font-semibold tabular-nums text-(--color-text) leading-none">
            {formatNumber(value)}/{formatNumber(target)}
          </span>
        </div>
      </div>
      <span className="text-xs text-text-muted text-center leading-tight truncate max-w-full">
        {label}
      </span>
    </div>
  );
}

export function WeeklyTicker({ stats, prevStats, goals }: WeeklyTickerProps) {
  const toast = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatStatsForCopy(stats));
    toast("Stats copied to clipboard");
  };

  const activeGoals = GOAL_METRICS.filter(
    ({ key }) => typeof goals?.[key] === "number" && goals[key]! > 0
  );

  return (
    <div className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) hover:shadow-(--shadow-skeuo-card-hover) border border-(--color-border) p-5 transition-all duration-300 xl:flex xl:flex-col xl:min-h-0">
      <div className="flex items-center justify-between pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-(--color-text)">
          <CalendarBlank
            size={20}
            weight="regular"
            className="text-primary-500 shrink-0"
          />
          This week
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy stats for standup"
          className="flex items-center justify-center gap-1.5 min-h-[36px] min-w-[36px] px-2.5 py-1.5 text-sm text-text-muted hover:text-primary-500 hover:bg-surface-elevated rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          title="Copy stats for standup"
        >
          <Copy size={16} weight="regular" />
          Copy
        </button>
      </div>

      <div className="pt-4 border-t border-(--color-border) space-y-4 xl:flex-1 xl:min-h-0">
        {activeGoals.length > 0 && (
          <div className="grid grid-cols-3 gap-3 pb-4 border-b border-(--color-border)">
            {activeGoals.map(({ key, label, Icon }) => {
              const raw = stats[key];
              const value = typeof raw === "number" ? raw : 0;
              return (
                <GoalRing
                  key={key}
                  value={value}
                  target={goals![key]!}
                  label={label}
                  Icon={Icon}
                />
              );
            })}
          </div>
        )}

        <div className="space-y-1">
          {METRICS.map(({ key, label, tooltip, Icon, better = "up", ...rest }, i) => {
            const isHours = "format" in rest && rest.format === "hours";
            const rawValue = stats[key];
            const numericValue =
              typeof rawValue === "number" ? rawValue : null;
            const prevRaw = prevStats?.[key];
            const prevNumeric =
              typeof prevRaw === "number" ? prevRaw : null;
            const delta =
              prevStats && numericValue != null && prevNumeric != null
                ? Math.round((numericValue - prevNumeric) * 100) / 100
                : null;
            const displayValue =
              numericValue == null
                ? "—"
                : isHours
                  ? `${formatNumber(numericValue)}h`
                  : formatNumber(numericValue);
            return (
              <div
                key={key}
                title={tooltip}
                className={`flex items-center justify-between gap-4 py-2.5 px-3 rounded-lg transition-colors ${
                  i % 2 === 1 ? "bg-surface-elevated/60" : ""
                } hover:bg-surface-elevated`}
              >
                <span className="flex items-center gap-2 text-sm text-text-muted min-w-0">
                  <Icon
                    size={16}
                    weight="regular"
                    className="text-primary-500 shrink-0"
                  />
                  <span className="truncate">{label}</span>
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-base font-semibold text-(--color-text) tabular-nums">
                    {displayValue}
                  </span>
                  {delta != null && (
                    <span
                      className="flex items-center gap-0.5 text-xs text-text-muted"
                      title={
                        delta > 0
                          ? `${formatSignedNumber(delta)} vs last week`
                          : delta < 0
                            ? `${formatSignedNumber(delta)} vs last week`
                            : "+0 vs last week"
                      }
                    >
                      {better !== "none" && (
                        <TrendBadge delta={delta} better={better} />
                      )}
                      <span>
                        {isHours
                          ? `${formatSignedNumber(delta)}h`
                          : formatSignedNumber(delta)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-3 pt-3 text-xs text-text-muted flex items-center gap-1.5">
        <Folder
          size={14}
          weight="regular"
          className="text-primary-500 shrink-0"
        />
        {stats.repos.length > 0 ? stats.repos.join(", ") : "—"}
      </p>
    </div>
  );
}
