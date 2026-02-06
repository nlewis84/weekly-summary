import { CalendarBlank, CaretUp, CaretDown, Minus, Copy, Package, Eye, CheckCircle, ArrowsClockwise, Folder } from "phosphor-react";
import { useToast } from "./Toast";
import type { Stats } from "../../lib/types";

interface WeeklyTickerProps {
  stats: Stats;
  prevStats?: Stats | null;
}

const METRIC_KEYS = ["prs_merged", "pr_reviews", "linear_completed", "linear_worked_on"] as const;

function TrendBadge({ delta }: { delta: number }) {
  if (delta === 0) return <Minus size={12} weight="bold" className="text-[var(--color-text-muted)]" aria-label="no change" />;
  if (delta > 0) return <CaretUp size={12} weight="bold" className="text-emerald-600 dark:text-emerald-400" aria-label={`+${delta}`} />;
  return <CaretDown size={12} weight="bold" className="text-amber-600 dark:text-amber-400" aria-label={`${delta}`} />;
}

function formatStatsForCopy(stats: Stats): string {
  const parts = [
    `PRs merged: ${stats.prs_merged}`,
    `PR reviews: ${stats.pr_reviews}`,
    `Linear completed: ${stats.linear_completed}`,
    `Linear worked on: ${stats.linear_worked_on}`,
    `Repos: ${stats.repos.join(", ") || "—"}`,
  ];
  return parts.join(" | ");
}

const METRICS = [
  { key: "prs_merged" as const, label: "PRs merged", Icon: Package },
  { key: "pr_reviews" as const, label: "PR reviews", Icon: Eye },
  { key: "linear_completed" as const, label: "Linear completed", Icon: CheckCircle },
  { key: "linear_worked_on" as const, label: "Linear worked on", Icon: ArrowsClockwise },
] as const;

export function WeeklyTicker({ stats, prevStats }: WeeklyTickerProps) {
  const toast = useToast();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatStatsForCopy(stats));
    toast("Stats copied to clipboard");
  };

  const getDelta = (key: (typeof METRIC_KEYS)[number]) => {
    if (!prevStats) return null;
    const curr = stats[key];
    const prev = prevStats[key];
    return curr - prev;
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] hover:shadow-[var(--shadow-skeuo-card-hover)] border border-[var(--color-border)] p-4 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--color-text)]">
          <CalendarBlank size={20} weight="regular" className="text-primary-500 shrink-0" />
          This week
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy stats for standup"
          className="flex items-center justify-center gap-1.5 min-h-[36px] min-w-[36px] px-2.5 py-1.5 text-sm text-[var(--color-text-muted)] hover:text-primary-500 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          title="Copy stats for standup"
        >
          <Copy size={16} weight="regular" />
          Copy
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {METRICS.map(({ key, label, Icon }) => {
          const delta = getDelta(key);
          return (
            <div
              key={key}
              className="flex flex-col gap-0.5 p-3 bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border)] shadow-[var(--shadow-skeuo-inset)]"
            >
              <span className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                <Icon size={14} weight="regular" className="text-primary-500 shrink-0" />
                {label}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-semibold text-primary-500 tabular-nums">{stats[key]}</span>
                {delta != null && (
                  <span className="flex items-center gap-0.5 text-xs text-[var(--color-text-muted)]" title={delta > 0 ? `+${delta} vs last week` : delta < 0 ? `${delta} vs last week` : "no change"}>
                    <TrendBadge delta={delta} />
                    {delta !== 0 && <span>{delta > 0 ? `+${delta}` : delta}</span>}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 p-3 bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border)]">
        <Folder size={16} weight="regular" className="text-primary-500 shrink-0" />
        <span className="text-sm text-[var(--color-text-muted)]">Repos</span>
        <span className="text-sm font-semibold text-primary-500 tabular-nums">{stats.repos.length}</span>
        {stats.repos.length > 0 && (
          <span className="text-sm text-[var(--color-text-muted)] truncate ml-1" title={stats.repos.join(", ")}>
            ({stats.repos.join(", ")})
          </span>
        )}
      </div>
    </div>
  );
}
