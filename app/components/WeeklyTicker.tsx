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
} from "phosphor-react";
import { useToast } from "./Toast";
import type { Stats } from "../../lib/types";
import type { WeeklyGoals } from "../hooks/useGoals";
import { formatNumber, formatSignedNumber } from "~/lib/utils";

interface WeeklyTickerProps {
  stats: Stats;
  prevStats?: Stats | null;
  goals?: WeeklyGoals;
}

function TrendBadge({ delta }: { delta: number }) {
  if (delta === 0)
    return (
      <WaveSine
        size={12}
        weight="bold"
        className="text-text-muted"
        aria-label="no change"
      />
    );
  if (delta > 0)
    return (
      <CaretUp
        size={12}
        weight="bold"
        className="text-emerald-600 dark:text-emerald-400"
        aria-label={`+${delta}`}
      />
    );
  return (
    <CaretDown
      size={12}
      weight="bold"
      className="text-amber-600 dark:text-amber-400"
      aria-label={`${delta}`}
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
    `Median review latency: ${latency}`,
    `Linear completed: ${stats.linear_completed}`,
    `Linear worked on: ${stats.linear_worked_on}`,
    `Linear issues created: ${stats.linear_issues_created}`,
    `Linear replies: ${stats.linear_comments}`,
    `Repos: ${stats.repos.join(", ") || "—"}`,
  ];
  return parts.join(" | ");
}

const METRICS = [
  { key: "prs_merged" as const, label: "PRs merged", Icon: Package },
  { key: "pr_reviews" as const, label: "PR reviews", Icon: Eye },
  { key: "pr_comments" as const, label: "PR comments", Icon: ChatCircle },
  { key: "commits_pushed" as const, label: "Commits pushed", Icon: GitCommit },
  {
    key: "lines_added" as const,
    label: "Lines added",
    Icon: FilePlus,
  },
  {
    key: "lines_deleted" as const,
    label: "Lines deleted",
    Icon: FileMinus,
  },
  {
    key: "files_changed" as const,
    label: "Files changed",
    Icon: Files,
  },
  {
    key: "median_review_latency_hours" as const,
    label: "Review time",
    Icon: Timer,
    format: "hours" as const,
  },
  {
    key: "linear_completed" as const,
    label: "Linear completed",
    Icon: CheckCircle,
  },
  {
    key: "linear_worked_on" as const,
    label: "Linear worked on",
    Icon: ArrowsClockwise,
  },
  {
    key: "linear_issues_created" as const,
    label: "Issues created",
    Icon: PlusCircle,
  },
  {
    key: "linear_comments" as const,
    label: "Linear replies",
    Icon: ChatCircle,
  },
] as const;

const GOAL_METRICS = ["prs_merged", "pr_reviews", "linear_completed"] as const;

export function WeeklyTicker({ stats, prevStats, goals }: WeeklyTickerProps) {
  const toast = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatStatsForCopy(stats));
    toast("Stats copied to clipboard");
  };

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

      <div className="pt-4 border-t border-(--color-border) space-y-1 xl:flex-1 xl:min-h-0">
        {METRICS.map(({ key, label, Icon, ...rest }, i) => {
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
          const target =
            goals && (GOAL_METRICS as readonly string[]).includes(key)
              ? (goals[key as (typeof GOAL_METRICS)[number]] as
                  | number
                  | undefined)
              : undefined;
          const displayValue =
            numericValue == null
              ? "—"
              : isHours
                ? `${formatNumber(numericValue)}h`
                : formatNumber(numericValue);
          const met =
            target != null && numericValue != null && numericValue >= target;
          return (
            <div
              key={key}
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
                {target != null &&
                  numericValue != null &&
                  numericValue < target && (
                  <div className="w-12 h-1 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500/60 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (numericValue / target) * 100)}%`,
                      }}
                    />
                  </div>
                )}
                <span className="text-base font-semibold text-(--color-text) tabular-nums">
                  {target != null && numericValue != null
                    ? `${formatNumber(numericValue)}/${formatNumber(target)}`
                    : displayValue}
                </span>
                {delta != null && target == null && (
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
                    <TrendBadge delta={delta} />
                    <span>
                      {isHours
                        ? `${formatSignedNumber(delta)}h`
                        : formatSignedNumber(delta)}
                    </span>
                  </span>
                )}
                {target != null && met && (
                  <span
                    className="text-emerald-600 dark:text-emerald-400 text-sm"
                    title="Goal met"
                  >
                    ✓
                  </span>
                )}
              </div>
            </div>
          );
        })}
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
