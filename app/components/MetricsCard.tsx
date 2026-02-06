import { useState } from "react";
import { Package, PencilSimple, Eye, CheckCircle, ArrowsClockwise, Folder, CaretDown, CaretRight } from "phosphor-react";
import type { Stats } from "../../lib/types";
import type { Payload } from "../../lib/types";

interface MetricsCardProps {
  stats: Stats;
  payload?: Payload | null;
}

type LinearIssue = { identifier?: string; title?: string; url?: string | null; project?: string | null };

const METRICS = [
  { key: "prs_merged" as const, label: "PRs merged", Icon: Package },
  { key: "prs_total" as const, label: "PRs created/updated", Icon: PencilSimple },
  { key: "pr_reviews" as const, label: "PR reviews", Icon: Eye },
  { key: "linear_completed" as const, label: "Linear issues completed", Icon: CheckCircle },
  { key: "linear_worked_on" as const, label: "Linear issues worked on", Icon: ArrowsClockwise },
] as const;

const iconSize = 24;

export function MetricsCard({ stats, payload }: MetricsCardProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const hasDetails = payload && (
    payload.github.merged_prs.length > 0 ||
    payload.github.reviews.length > 0 ||
    payload.linear.completed_issues.length > 0 ||
    payload.linear.worked_on_issues.length > 0
  );

  return (
    <div className="bg-white rounded-xl shadow-[var(--shadow-skeuo-card)] hover:shadow-[var(--shadow-skeuo-card-hover)] border border-gray-200/90 p-6 transition-all duration-300">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {METRICS.map(({ key, label, Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200/60 shadow-[var(--shadow-skeuo-inset)]"
          >
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <Icon size={iconSize} weight="regular" className="text-primary-600 shrink-0" />
              {label}
            </span>
            <span className="text-lg font-semibold text-primary-600">
              {stats[key]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <span className="flex items-center gap-2 text-sm text-gray-600">
          <Folder size={iconSize} weight="regular" className="text-primary-600 shrink-0" />
          Repos worked on
        </span>
        <p className="text-sm font-medium text-gray-900 mt-1">
          {stats.repos.length > 0 ? stats.repos.join(", ") : "—"}
        </p>
      </div>

      {hasDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setDetailsOpen((o) => !o)}
            className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
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
                  <h3 className="font-medium text-gray-700 mb-2">PRs merged</h3>
                  <ul className="space-y-1">
                    {payload!.github.merged_prs.map((pr, i) => (
                      <li key={i}>
                        <a
                          href={pr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          {pr.title}
                        </a>
                        {pr.repo && <span className="text-gray-500 ml-1">({pr.repo})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {payload!.github.reviews.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">PR reviews</h3>
                  <ul className="space-y-1">
                    {payload!.github.reviews.map((r, i) => (
                      <li key={i}>
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary-600 hover:underline"
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
                  <h3 className="font-medium text-gray-700 mb-2">Linear completed</h3>
                  <ul className="space-y-1">
                    {(payload!.linear.completed_issues as LinearIssue[]).map((i, idx) => (
                      <li key={idx}>
                        {i.url ? (
                          <a
                            href={i.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600 hover:underline"
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
                  <h3 className="font-medium text-gray-700 mb-2">Linear worked on</h3>
                  <ul className="space-y-1">
                    {(payload!.linear.worked_on_issues as LinearIssue[]).map((i, idx) => (
                      <li key={idx}>
                        {i.url ? (
                          <a
                            href={i.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600 hover:underline"
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
