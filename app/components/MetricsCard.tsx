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
  CaretUp,
  WaveSine,
  ChatCircle,
  GitCommit,
  PlusCircle,
  FilePlus,
  FileMinus,
  Files,
  Timer,
  type Icon,
} from "phosphor-react";
import type { Stats } from "../../lib/types";
import type { Payload } from "../../lib/types";
import type { WeeklyGoals } from "../hooks/useGoals";
import { formatNumber, formatSignedNumber } from "~/lib/utils";

interface MetricsCardProps {
  stats: Stats;
  prevStats?: Stats | null;
  payload?: Payload | null;
  goals?: WeeklyGoals;
}

type MetricDef = {
  key: keyof Stats;
  label: string;
  tooltip?: string;
  Icon: Icon;
  format?: "hours";
};

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
        className="text-success-500"
        aria-label={`+${delta}`}
      />
    );
  return (
    <CaretDown
      size={12}
      weight="bold"
      className="text-text-muted"
      aria-label={`${delta}`}
    />
  );
}

type LinearIssue = {
  identifier?: string;
  title?: string;
  url?: string | null;
  project?: string | null;
};

/** Always shown — the day’s main signal. */
const PRIMARY_METRICS: MetricDef[] = [
  {
    key: "prs_merged",
    label: "PRs merged",
    tooltip: "PRs merged",
    Icon: Package,
  },
  {
    key: "pr_reviews",
    label: "PR reviews",
    tooltip: "PR reviews",
    Icon: Eye,
  },
  {
    key: "pr_comments",
    label: "PR comments",
    tooltip: "PR comments",
    Icon: ChatCircle,
  },
  {
    key: "median_review_latency_hours",
    label: "Review time",
    tooltip: "Median hours from review request to your first review",
    Icon: Timer,
    format: "hours",
  },
  {
    key: "linear_completed",
    label: "Linear done",
    tooltip: "Linear issues completed",
    Icon: CheckCircle,
  },
  {
    key: "lines_added",
    label: "Lines added",
    tooltip: "Additions across merged PRs",
    Icon: FilePlus,
  },
];

/** Shown only when non-zero — quieter inventory. */
const SECONDARY_METRICS: MetricDef[] = [
  {
    key: "commits_pushed",
    label: "Commits pushed",
    tooltip: "Commits pushed",
    Icon: GitCommit,
  },
  {
    key: "linear_worked_on",
    label: "Linear active",
    tooltip: "Linear issues worked on",
    Icon: ArrowsClockwise,
  },
  {
    key: "prs_total",
    label: "PRs active",
    tooltip: "PRs created or updated",
    Icon: PencilSimple,
  },
  {
    key: "lines_deleted",
    label: "Lines deleted",
    tooltip: "Deletions across merged PRs",
    Icon: FileMinus,
  },
  {
    key: "files_changed",
    label: "Files changed",
    tooltip: "Changed files across merged PRs",
    Icon: Files,
  },
  {
    key: "linear_issues_created",
    label: "Linear created",
    tooltip: "Linear issues created",
    Icon: PlusCircle,
  },
  {
    key: "linear_comments",
    label: "Linear replies",
    tooltip: "Linear issues commented on",
    Icon: ChatCircle,
  },
];

const GOAL_METRICS = ["prs_merged", "pr_reviews", "linear_completed"] as const;

function metricDisplay(
  stats: Stats,
  def: MetricDef
): { numeric: number | null; text: string } {
  const raw = stats[def.key];
  const numeric = typeof raw === "number" ? raw : null;
  if (numeric == null) return { numeric: null, text: "—" };
  if (def.format === "hours") {
    return { numeric, text: `${formatNumber(numeric)}h` };
  }
  return { numeric, text: formatNumber(numeric) };
}

function metricDelta(
  stats: Stats,
  prevStats: Stats | null | undefined,
  key: keyof Stats
): number | null {
  if (!prevStats) return null;
  const curr = stats[key];
  const prev = prevStats[key];
  if (typeof curr !== "number" || typeof prev !== "number") return null;
  return Math.round((curr - prev) * 100) / 100;
}

function hasActivity(stats: Stats, def: MetricDef): boolean {
  const raw = stats[def.key];
  return typeof raw === "number" && raw !== 0;
}

function MetricCell({
  def,
  stats,
  prevStats,
  goals,
}: {
  def: MetricDef;
  stats: Stats;
  prevStats?: Stats | null;
  goals?: WeeklyGoals;
}) {
  const { numeric, text } = metricDisplay(stats, def);
  const delta = metricDelta(stats, prevStats, def.key);
  const target =
    goals && (GOAL_METRICS as readonly string[]).includes(def.key)
      ? (goals[def.key as (typeof GOAL_METRICS)[number]] as number | undefined)
      : undefined;
  const met = target != null && numeric != null && numeric >= target;
  const quiet = numeric == null || numeric === 0;
  const { Icon } = def;

  return (
    <div className="flex items-center gap-2.5 min-w-0" title={def.tooltip}>
      <Icon
        size={20}
        weight="regular"
        className={`shrink-0 ${quiet ? "text-primary-500/35" : "text-primary-500"}`}
      />
      <div className="min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className={`text-2xl font-semibold tabular-nums leading-none ${
              quiet ? "text-text-muted" : "text-text"
            }`}
          >
            {target != null && numeric != null
              ? `${formatNumber(numeric)}/${formatNumber(target)}`
              : text}
          </span>
          {delta != null && target == null && !quiet && (
            <span className="flex items-center gap-0.5 text-xs text-text-muted">
              <TrendBadge delta={delta} />
              <span>
                {def.format === "hours"
                  ? `${formatSignedNumber(delta)}h`
                  : formatSignedNumber(delta)}
              </span>
            </span>
          )}
          {met && (
            <span className="text-success-500 text-sm" title="Goal met">
              ✓
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-text-muted">{def.label}</p>
      </div>
    </div>
  );
}

export function MetricsCard({
  stats,
  prevStats,
  payload,
  goals,
}: MetricsCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const hasDetails =
    payload &&
    (payload.github.merged_prs.length > 0 ||
      (payload.github.open_prs?.length ?? 0) > 0 ||
      payload.github.reviews.length > 0 ||
      payload.linear.completed_issues.length > 0 ||
      payload.linear.worked_on_issues.length > 0 ||
      (payload.linear.created_issues?.length ?? 0) > 0 ||
      (payload.linear.commented_issues?.length ?? 0) > 0);

  return (
    <div className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) hover:shadow-(--shadow-skeuo-card-hover) border border-(--color-border) p-5 transition-all duration-300 xl:flex xl:flex-col xl:min-h-0">
      <h2 className="text-lg font-semibold text-text pb-4">Metrics</h2>

      <div className="xl:flex-1 xl:min-h-0 xl:flex xl:flex-col pt-4 border-t border-(--color-border)">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-6 gap-y-5">
          {PRIMARY_METRICS.map((def) => (
            <MetricCell
              key={def.key}
              def={def}
              stats={stats}
              prevStats={prevStats}
              goals={goals}
            />
          ))}
          {SECONDARY_METRICS.filter((def) => hasActivity(stats, def)).map(
            (def) => (
              <MetricCell
                key={def.key}
                def={def}
                stats={stats}
                prevStats={prevStats}
                goals={goals}
              />
            )
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-(--color-border) min-w-0">
          <span className="flex items-center gap-2 text-sm text-text-muted">
            <Folder
              size={16}
              weight="regular"
              className="text-primary-500 shrink-0"
            />
            Repos worked on
          </span>
          <p className="text-sm font-medium text-text mt-1 leading-normal">
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
                      <h3 className="text-sm font-medium text-text-muted mb-2">
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
                            {pr.additions != null || pr.deletions != null ? (
                              <span className="text-text-muted ml-1 tabular-nums">
                                · +{formatNumber(pr.additions ?? 0)}/-
                                {formatNumber(pr.deletions ?? 0)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(payload!.github.open_prs?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-muted mb-2">
                        PRs active
                      </h3>
                      <ul className="space-y-1">
                        {payload!.github.open_prs.map((pr, i) => (
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
                      <h3 className="text-sm font-medium text-text-muted mb-2">
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
                            {r.repo && (
                              <span className="text-text-muted ml-1">
                                ({r.repo})
                              </span>
                            )}
                            {r.latency_hours != null ? (
                              <span className="text-text-muted ml-1 tabular-nums">
                                · {formatNumber(r.latency_hours)}h
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {payload!.linear.completed_issues.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-muted mb-2">
                        Linear done
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
                      <h3 className="text-sm font-medium text-text-muted mb-2">
                        Linear active
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
                      <h3 className="text-sm font-medium text-text-muted mb-2">
                        Linear created
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
                  {(payload!.linear.commented_issues?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-text-muted mb-2">
                        Linear replies
                      </h3>
                      <ul className="space-y-1">
                        {(
                          (payload!.linear.commented_issues ??
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
