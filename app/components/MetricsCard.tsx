import { useState } from "react";
import {
  Package,
  PencilSimple,
  Eye,
  CheckCircle,
  ArrowsClockwise,
  Folder,
  CaretDown,
  CaretRight,
  Copy,
  CaretUp,
  Minus,
  ChatCircle,
  GitCommit,
  PlusCircle,
} from "phosphor-react";
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
  if (delta === 0)
    return (
      <Minus
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
  const parts = [
    `PRs merged: ${stats.prs_merged}`,
    `PR reviews: ${stats.pr_reviews}`,
    `PR comments: ${stats.pr_comments}`,
    `Commits pushed: ${stats.commits_pushed}`,
    `Linear completed: ${stats.linear_completed}`,
    `Linear worked on: ${stats.linear_worked_on}`,
    `Linear issues created: ${stats.linear_issues_created}`,
    `Repos: ${stats.repos.join(", ") || "—"}`,
  ];
  return parts.join(" | ");
}

type LinearIssue = {
  identifier?: string;
  title?: string;
  url?: string | null;
  project?: string | null;
};

const METRICS = [
  { key: "prs_merged" as const, label: "PRs merged", Icon: Package },
  {
    key: "prs_total" as const,
    label: "PRs created/updated",
    Icon: PencilSimple,
  },
  { key: "pr_reviews" as const, label: "PR reviews", Icon: Eye },
  { key: "pr_comments" as const, label: "PR comments", Icon: ChatCircle },
  { key: "commits_pushed" as const, label: "Commits pushed", Icon: GitCommit },
  {
    key: "linear_completed" as const,
    label: "Linear issues completed",
    Icon: CheckCircle,
  },
  {
    key: "linear_worked_on" as const,
    label: "Linear issues worked on",
    Icon: ArrowsClockwise,
  },
  {
    key: "linear_issues_created" as const,
    label: "Linear issues created",
    Icon: PlusCircle,
  },
] as const;

const TREND_METRICS = [
  "prs_merged",
  "prs_total",
  "pr_reviews",
  "pr_comments",
  "commits_pushed",
  "linear_completed",
  "linear_worked_on",
  "linear_issues_created",
] as const;

const GOAL_METRICS = ["prs_merged", "pr_reviews", "linear_completed"] as const;

const iconSize = 24;

export function MetricsCard({
  stats,
  prevStats,
  payload,
  goals,
}: MetricsCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const toast = useToast();

  const handleCopy = async () => {
    const text = formatStatsForCopy(stats);
    await navigator.clipboard.writeText(text);
    toast("Stats copied to clipboard");
  };

  const hasDetails =
    payload &&
    (payload.github.merged_prs.length > 0 ||
      payload.github.reviews.length > 0 ||
      payload.linear.completed_issues.length > 0 ||
      payload.linear.worked_on_issues.length > 0 ||
      (payload.linear.created_issues?.length ?? 0) > 0);

  return (
    <div className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) hover:shadow-(--shadow-skeuo-card-hover) border border-(--color-border) p-5 transition-all duration-300 xl:h-full xl:flex xl:flex-col xl:min-h-0">
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-lg font-semibold text-(--color-text)">Metrics</h2>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy stats for standup"
          className="flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 py-2 text-sm text-text-muted hover:text-primary-500 hover:bg-surface-elevated rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          title="Copy stats for standup"
        >
          <Copy size={16} weight="regular" />
          Copy
        </button>
      </div>
      <div className="xl:flex-1 xl:min-h-0 xl:flex xl:flex-col pt-4 border-t border-(--color-border)">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {METRICS.map(({ key, label, Icon }) => {
            const delta =
              prevStats && TREND_METRICS.includes(key)
                ? stats[key] - prevStats[key]
                : null;
            const target =
              goals && GOAL_METRICS.includes(key)
                ? (goals[key as (typeof GOAL_METRICS)[number]] as
                    | number
                    | undefined)
                : undefined;
            const value = stats[key];
            const met = target != null && value >= target;
            return (
              <div
                key={key}
                className={`flex items-center justify-between gap-3 min-w-0 overflow-hidden p-3 bg-surface-elevated rounded-lg border shadow-(--shadow-skeuo-inset) ${met ? "border-emerald-500/50" : "border-(--color-border)"}`}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1 text-sm text-text-muted">
                  <Icon
                    size={iconSize}
                    weight="regular"
                    className="text-primary-500 shrink-0"
                  />
                  <span className="truncate" title={label}>
                    {label}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <span className="text-lg font-semibold text-primary-500 tabular-nums">
                    {target != null ? `${value}/${target}` : value}
                  </span>
                  {delta != null && target == null && (
                    <span
                      className="flex items-center gap-0.5 text-xs"
                      title={
                        delta > 0
                          ? `+${delta} vs last week`
                          : delta < 0
                            ? `${delta} vs last week`
                            : "no change"
                      }
                    >
                      <TrendBadge delta={delta} />
                      {delta !== 0 && (
                        <span>{delta > 0 ? `+${delta}` : delta}</span>
                      )}
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
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-(--color-border) min-w-0">
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <Folder
              size={iconSize}
              weight="regular"
              className="text-primary-500 shrink-0"
            />
            Repos worked on
          </span>
          <p className="text-sm font-medium text-(--color-text) mt-1 truncate" title={stats.repos.length > 0 ? stats.repos.join(", ") : undefined}>
            {stats.repos.length > 0 ? stats.repos.join(", ") : "—"}
          </p>
        </div>

        {hasDetails && (
          <div className="mt-4 pt-4 border-t border-(--color-border)">
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
                <div
                  className={`mt-3 space-y-4 text-sm transition-opacity duration-300 ${detailsOpen ? "opacity-100" : "opacity-0"}`}
                >
                  {payload!.github.merged_prs.length > 0 && (
                    <div>
                      <h3 className="font-medium text-text-muted mb-2">
                        PRs merged
                      </h3>
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
                            {pr.repo && (
                              <span className="text-text-muted ml-1">
                                ({pr.repo})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {payload!.github.reviews.length > 0 && (
                    <div>
                      <h3 className="font-medium text-text-muted mb-2">
                        PR reviews
                      </h3>
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
                      <h3 className="font-medium text-text-muted mb-2">
                        Linear completed
                      </h3>
                      <ul className="space-y-1">
                        {(
                          payload!.linear.completed_issues as LinearIssue[]
                        ).map((i, idx) => (
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
                              <span>
                                {i.identifier} {i.title}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {payload!.linear.worked_on_issues.length > 0 && (
                    <div>
                      <h3 className="font-medium text-text-muted mb-2">
                        Linear worked on
                      </h3>
                      <ul className="space-y-1">
                        {(
                          payload!.linear.worked_on_issues as LinearIssue[]
                        ).map((i, idx) => (
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
                              <span>
                                {i.identifier} {i.title}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(payload!.linear.created_issues?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="font-medium text-text-muted mb-2">
                        Linear issues created
                      </h3>
                      <ul className="space-y-1">
                        {(
                          (payload!.linear.created_issues ??
                            []) as LinearIssue[]
                        ).map((i, idx) => (
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
                              <span>
                                {i.identifier} {i.title}
                              </span>
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
    </div>
  );
}
