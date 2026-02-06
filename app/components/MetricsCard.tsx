import { useState } from "react";
import { Package, PencilSimple, Eye, CheckCircle, ArrowsClockwise, Folder, CaretDown, CaretRight, Copy, CaretUp, Minus, ChatCircle, GitCommit } from "phosphor-react";
import { useToast } from "./Toast";
import type { Stats } from "../../lib/types";
import type { Payload } from "../../lib/types";
import type { WeeklyGoals } from "../hooks/useGoals";

interface MetricsCardProps {
  stats: Stats;
  prevStats?: Stats | null;
  payload?: Payload | null;
  goals?: WeeklyGoals;
}

function TrendBadge({ delta }: { delta: number }) {
  if (delta === 0) return <Minus size={12} weight="bold" className="text-[var(--color-text-muted)]" aria-label="no change" />;
  if (delta > 0) return <CaretUp size={12} weight="bold" className="text-emerald-600 dark:text-emerald-400" aria-label={`+${delta}`} />;
  return <CaretDown size={12} weight="bold" className="text-amber-600 dark:text-amber-400" aria-label={`${delta}`} />;
}

function formatStatsForCopy(stats: Stats): string {
  const parts = [
    `PRs merged: ${stats.prs_merged}`,
    `PR reviews: ${stats.pr_reviews}`,
    `PR comments: ${stats.pr_comments}`,
    `Commits pushed: ${stats.commits_pushed}`,
    `Linear completed: ${stats.linear_completed}`,
    `Linear worked on: ${stats.linear_worked_on}`,
    `Repos: ${stats.repos.join(", ") || "—"}`,
  ];
  return parts.join(" | ");
}

type LinearIssue = { identifier?: string; title?: string; url?: string | null; project?: string | null };

const METRICS = [
  { key: "prs_merged" as const, label: "PRs merged", Icon: Package },
  { key: "prs_total" as const, label: "PRs created/updated", Icon: PencilSimple },
  { key: "pr_reviews" as const, label: "PR reviews", Icon: Eye },
  { key: "pr_comments" as const, label: "PR comments", Icon: ChatCircle },
  { key: "commits_pushed" as const, label: "Commits pushed", Icon: GitCommit },
  { key: "linear_completed" as const, label: "Linear issues completed", Icon: CheckCircle },
  { key: "linear_worked_on" as const, label: "Linear issues worked on", Icon: ArrowsClockwise },
] as const;

const TREND_METRICS = ["prs_merged", "prs_total", "pr_reviews", "pr_comments", "commits_pushed", "linear_completed", "linear_worked_on"] as const;

const GOAL_METRICS = ["prs_merged", "pr_reviews", "linear_completed"] as const;

const iconSize = 24;

export function MetricsCard({ stats, prevStats, payload, goals }: MetricsCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    const text = formatStatsForCopy(stats);
    await navigator.clipboard.writeText(text);
    toast("Stats copied to clipboard");
  };

  const hasDetails = payload && (
    payload.github.merged_prs.length > 0 ||
    payload.github.reviews.length > 0 ||
    payload.linear.completed_issues.length > 0 ||
    payload.linear.worked_on_issues.length > 0
  );

  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] hover:shadow-[var(--shadow-skeuo-card-hover)] border border-[var(--color-border)] p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Metrics</h2>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy stats for standup"
          className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-primary-500 hover:bg-[var(--color-surface-elevated)] rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          title="Copy stats for standup"
        >
          <Copy size={16} weight="regular" />
          Copy
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {METRICS.map(({ key, label, Icon }) => {
          const delta = prevStats && TREND_METRICS.includes(key) ? stats[key] - prevStats[key] : null;
          const target = goals && GOAL_METRICS.includes(key) ? (goals[key as (typeof GOAL_METRICS)[number]] as number | undefined) : undefined;
          const value = stats[key];
          const met = target != null && value >= target;
          return (
            <div
              key={key}
              className={`flex items-center justify-between p-3 bg-[var(--color-surface-elevated)] rounded-lg border shadow-[var(--shadow-skeuo-inset)] ${met ? "border-emerald-500/50" : "border-[var(--color-border)]"}`}
            >
              <span className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <Icon size={iconSize} weight="regular" className="text-primary-500 shrink-0" />
                {label}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-lg font-semibold text-primary-500">
                  {target != null ? `${value}/${target}` : value}
                </span>
                {delta != null && target == null && (
                  <span className="flex items-center gap-0.5 text-xs" title={delta > 0 ? `+${delta} vs last week` : delta < 0 ? `${delta} vs last week` : "no change"}>
                    <TrendBadge delta={delta} />
                    {delta !== 0 && <span>{delta > 0 ? `+${delta}` : delta}</span>}
                  </span>
                )}
                {target != null && met && (
                  <span className="text-emerald-600 dark:text-emerald-400 text-sm" title="Goal met">✓</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
        <span className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Folder size={iconSize} weight="regular" className="text-primary-500 shrink-0" />
          Repos worked on
        </span>
        <p className="text-sm font-medium text-[var(--color-text)] mt-1">
          {stats.repos.length > 0 ? stats.repos.join(", ") : "—"}
        </p>
      </div>

      {hasDetails && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setDetailsOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-primary-500 hover:text-primary-400"
          >
            {detailsOpen ? (
              <CaretDown size={18} weight="bold" />
            ) : (
              <CaretRight size={18} weight="bold" />
            )}
            View details
          </button>
          <div
            className="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{ gridTemplateRows: detailsOpen ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden min-h-0">
              <div className={`mt-3 space-y-4 text-sm transition-opacity duration-300 ${detailsOpen ? "opacity-100" : "opacity-0"}`}>
              {payload!.github.merged_prs.length > 0 && (
                <div>
                  <h3 className="font-medium text-[var(--color-text-muted)] mb-2">PRs merged</h3>
                  <ul className="space-y-1">
                    {payload!.github.merged_prs.map((pr, i) => (
                      <li key={i}>
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-500 hover:underline"
                        >
                          {pr.title}
                        </a>
                        {pr.repo && <span className="text-[var(--color-text-muted)] ml-1">({pr.repo})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {payload!.github.reviews.length > 0 && (
                <div>
                  <h3 className="font-medium text-[var(--color-text-muted)] mb-2">PR reviews</h3>
                  <ul className="space-y-1">
                    {payload!.github.reviews.map((r, i) => (
                      <li key={i}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-500 hover:underline"
                        >
                          {r.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {payload!.linear.completed_issues.length > 0 && (
                <div>
                  <h3 className="font-medium text-[var(--color-text-muted)] mb-2">Linear completed</h3>
                  <ul className="space-y-1">
                    {(payload!.linear.completed_issues as LinearIssue[]).map((i, idx) => (
                      <li key={idx}>
                        {i.url ? (
                          <a
                            href={i.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-500 hover:underline"
                          >
                            {i.identifier} {i.title}
                          </a>
                        ) : (
                          <span>{i.identifier} {i.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {payload!.linear.worked_on_issues.length > 0 && (
                <div>
                  <h3 className="font-medium text-[var(--color-text-muted)] mb-2">Linear worked on</h3>
                  <ul className="space-y-1">
                    {(payload!.linear.worked_on_issues as LinearIssue[]).map((i, idx) => (
                      <li key={idx}>
                        {i.url ? (
                          <a
                            href={i.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-500 hover:underline"
                          >
                            {i.identifier} {i.title}
                          </a>
                        ) : (
                          <span>{i.identifier} {i.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
