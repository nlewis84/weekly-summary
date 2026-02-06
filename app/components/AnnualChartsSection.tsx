/**
 * Annual dashboard section - reusable for Charts page and history.annual.
 * Metric cards, compare totals, monthly trend, top repos/projects, weeks links.
 */
import { Link } from "react-router";
import { Suspense } from "react";
import { CalendarBlank } from "phosphor-react";
import { AnnualChartsContent } from "./AnnualChartsContent";
import type { AnnualData } from "../../lib/annual-data";

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface rounded-xl border border-(--color-border) p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-xl font-semibold text-primary-500">{value}</p>
    </div>
  );
}

function formatDelta(a: number, b: number): string {
  if (b === 0) return a > 0 ? "+∞" : "0%";
  const pct = Math.round(((a - b) / b) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

function CompareTotals({
  primary,
  compare,
}: {
  primary: AnnualData;
  compare: AnnualData;
}) {
  const metrics: { key: keyof AnnualData; label: string }[] = [
    { key: "total_prs_merged", label: "PRs merged" },
    { key: "total_pr_reviews", label: "PR reviews" },
    { key: "total_pr_comments", label: "PR comments" },
    { key: "total_commits_pushed", label: "Commits pushed" },
    { key: "total_linear_completed", label: "Linear completed" },
    { key: "total_linear_worked_on", label: "Linear worked on" },
    { key: "total_linear_issues_created", label: "Linear issues created" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map(({ key, label }) => {
        const a = primary[key] as number;
        const b = compare[key] as number;
        const delta = formatDelta(a, b);
        const isUp = a > b;
        const isDown = a < b;
        return (
          <div
            key={key}
            className="bg-surface rounded-xl border border-(--color-border) p-4"
          >
            <p className="text-xs text-text-muted">{label}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-semibold text-primary-500">
                {a}
              </span>
              <span className="text-sm text-text-muted">vs {b}</span>
              <span
                className={`text-xs font-medium ${
                  isUp
                    ? "text-emerald-500"
                    : isDown
                      ? "text-red-500"
                      : "text-text-muted"
                }`}
              >
                {delta}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface AnnualChartsSectionProps {
  annualData: AnnualData;
  compareData: AnnualData | null;
  years: string[];
  year: string;
  compareYear: string;
  onYearChange: (y: string) => void;
  onCompareChange: (c: string) => void;
  /** Optional: show back link (e.g. when embedded in Charts, no back link) */
  showBackLink?: boolean;
}

export function AnnualChartsSection({
  annualData,
  compareData,
  years,
  year,
  compareYear,
  onYearChange,
  onCompareChange,
  showBackLink = false,
}: AnnualChartsSectionProps) {
  const compareYears = years.filter((y) => y !== year);

  return (
    <div className="space-y-6">
      {showBackLink && (
        <Link
          to="/history"
          prefetch="intent"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary-500"
        >
          ← Back to History
        </Link>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-(--color-text)">
          Annual — {annualData.year}
          {compareData && ` vs ${compareData.year}`}
        </h3>
        <div className="flex flex-wrap gap-2">
          {years.length > 1 && (
            <select
              value={year}
              onChange={(e) => onYearChange(e.target.value)}
              className="px-4 py-2 bg-surface-elevated border border-(--color-border) rounded-lg text-(--color-text) focus:ring-2 focus:ring-primary-500"
              aria-label="Select year"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
          {compareYears.length > 0 && (
            <select
              value={compareYear}
              onChange={(e) => onCompareChange(e.target.value)}
              className="px-4 py-2 bg-surface-elevated border border-(--color-border) rounded-lg text-(--color-text) focus:ring-2 focus:ring-primary-500"
              aria-label="Compare with year"
            >
              <option value="">Compare with…</option>
              {compareYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {compareData ? (
        <CompareTotals primary={annualData} compare={compareData} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <MetricCard label="PRs merged" value={annualData.total_prs_merged} />
          <MetricCard label="PR reviews" value={annualData.total_pr_reviews} />
          <MetricCard
            label="PR comments"
            value={annualData.total_pr_comments}
          />
          <MetricCard
            label="Commits pushed"
            value={annualData.total_commits_pushed}
          />
          <MetricCard
            label="Linear completed"
            value={annualData.total_linear_completed}
          />
          <MetricCard
            label="Linear worked on"
            value={annualData.total_linear_worked_on}
          />
          <MetricCard
            label="Linear issues created"
            value={annualData.total_linear_issues_created}
          />
        </div>
      )}

      {annualData.months.length > 0 && (
        <div className="bg-surface rounded-xl border border-(--color-border) p-4 sm:p-6 overflow-hidden">
          <h4 className="text-sm font-medium text-(--color-text) mb-4">
            Monthly trend
          </h4>
          <Suspense
            fallback={
              <div className="h-72 animate-pulse bg-surface-elevated rounded" />
            }
          >
            <AnnualChartsContent months={annualData.months} />
          </Suspense>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-(--color-border) p-4 sm:p-6">
          <h4 className="text-sm font-medium text-(--color-text) mb-4">
            Top repos (PRs merged)
          </h4>
          <ul className="space-y-2">
            {annualData.topRepos.slice(0, 10).map(({ repo, prs }) => (
              <li key={repo} className="flex justify-between text-sm">
                <span className="text-(--color-text)">{repo}</span>
                <span className="text-text-muted">{prs}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-surface rounded-xl border border-(--color-border) p-4 sm:p-6">
          <h4 className="text-sm font-medium text-(--color-text) mb-4">
            Top Linear projects
          </h4>
          <ul className="space-y-2">
            {annualData.topProjects.slice(0, 10).map(({ project, issues }) => (
              <li key={project} className="flex justify-between text-sm">
                <span className="text-(--color-text) truncate max-w-[200px]">
                  {project}
                </span>
                <span className="text-text-muted shrink-0">
                  {issues}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-surface rounded-xl border border-(--color-border) p-4 sm:p-6">
        <h4 className="text-sm font-medium text-(--color-text) mb-4">
          Weeks ({annualData.weeks.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {annualData.weeks.map((w) => (
            <Link
              key={w}
              to={`/history/${w}`}
              prefetch="intent"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-surface-elevated hover:bg-primary-500/10 rounded-lg text-(--color-text) hover:text-primary-500 transition-colors"
            >
              <CalendarBlank size={14} weight="regular" />
              {w}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
