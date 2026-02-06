import { useLoaderData, Link, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { getAnnualData, getAvailableYears } from "../../lib/annual-data";
import type { AnnualData } from "../../lib/annual-data";
import { ArrowLeft, CalendarBlank } from "phosphor-react";
import { Suspense } from "react";
import { AnnualChartsContent } from "../components/AnnualChartsContent";

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
      <p className="text-xl font-semibold text-primary-500">{value}</p>
    </div>
  );
}

function CompareTotals({ primary, compare }: { primary: AnnualData; compare: AnnualData }) {
  const metrics: { key: keyof AnnualData; label: string }[] = [
    { key: "total_prs_merged", label: "PRs merged" },
    { key: "total_pr_reviews", label: "PR reviews" },
    { key: "total_pr_comments", label: "PR comments" },
    { key: "total_commits_pushed", label: "Commits pushed" },
    { key: "total_linear_completed", label: "Linear completed" },
    { key: "total_linear_worked_on", label: "Linear worked on" },
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
          <div key={key} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
            <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-xl font-semibold text-primary-500">{a}</span>
              <span className="text-sm text-[var(--color-text-muted)]">vs {b}</span>
              <span
                className={`text-xs font-medium ${
                  isUp ? "text-emerald-500" : isDown ? "text-red-500" : "text-[var(--color-text-muted)]"
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

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const year = url.searchParams.get("year") ?? new Date().getFullYear().toString();
  const compareYear = url.searchParams.get("compare") ?? null;

  try {
    const [annualData, years, compareData] = await Promise.all([
      getAnnualData(year),
      getAvailableYears(),
      compareYear && compareYear !== year ? getAnnualData(compareYear) : Promise.resolve(null),
    ]);
    return data({ annualData, compareData, years, error: null as string | null });
  } catch (err) {
    console.error("Annual loader error:", err);
    return data({
      annualData: null,
      compareData: null,
      years: [],
      error: (err as Error).message,
    });
  }
}

function formatDelta(a: number, b: number): string {
  if (b === 0) return a > 0 ? "+∞" : "0%";
  const pct = Math.round(((a - b) / b) * 100);
  return pct >= 0 ? `+${pct}%` : `${pct}%`;
}

export default function HistoryAnnual() {
  const { annualData, compareData, years, error } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const year = searchParams.get("year") ?? annualData?.year ?? new Date().getFullYear().toString();
  const compareYear = searchParams.get("compare") ?? "";

  const handleYearChange = (y: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("year", y);
    setSearchParams(next);
  };

  const handleCompareChange = (c: string) => {
    const next = new URLSearchParams(searchParams);
    if (c) next.set("compare", c);
    else next.delete("compare");
    setSearchParams(next);
  };

  const compareYears = years.filter((y) => y !== year);

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-primary-500"
        >
          <ArrowLeft size={18} weight="regular" />
          Back to History
        </Link>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-amber-700 dark:text-amber-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!annualData) {
    return (
      <div className="space-y-6">
        <Link
          to="/history"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-primary-500"
        >
          <ArrowLeft size={18} weight="regular" />
          Back to History
        </Link>
        <div className="bg-[var(--color-surface)] rounded-xl p-8 text-center text-[var(--color-text-muted)] border border-[var(--color-border)]">
          No data for {year}.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/history"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-primary-500"
      >
        <ArrowLeft size={18} weight="regular" />
        Back to History
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Annual Dashboard — {annualData.year}
          {compareData && ` vs ${compareData.year}`}
        </h2>
        <div className="flex flex-wrap gap-2">
          {years.length > 1 && (
            <select
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
              className="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-primary-500"
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
              onChange={(e) => handleCompareChange(e.target.value)}
              className="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] focus:ring-2 focus:ring-primary-500"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="PRs merged" value={annualData.total_prs_merged} />
          <MetricCard label="PR reviews" value={annualData.total_pr_reviews} />
          <MetricCard label="PR comments" value={annualData.total_pr_comments} />
          <MetricCard label="Commits pushed" value={annualData.total_commits_pushed} />
          <MetricCard label="Linear completed" value={annualData.total_linear_completed} />
          <MetricCard label="Linear worked on" value={annualData.total_linear_worked_on} />
        </div>
      )}

      {annualData.months.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-6 overflow-hidden">
          <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Monthly trend</h3>
          <Suspense fallback={<div className="h-72 animate-pulse bg-[var(--color-surface-elevated)] rounded" />}>
            <AnnualChartsContent months={annualData.months} />
          </Suspense>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-6">
          <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Top repos (PRs merged)</h3>
          <ul className="space-y-2">
            {annualData.topRepos.slice(0, 10).map(({ repo, prs }) => (
              <li key={repo} className="flex justify-between text-sm">
                <span className="text-[var(--color-text)]">{repo}</span>
                <span className="text-[var(--color-text-muted)]">{prs}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-6">
          <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Top Linear projects</h3>
          <ul className="space-y-2">
            {annualData.topProjects.slice(0, 10).map(({ project, issues }) => (
              <li key={project} className="flex justify-between text-sm">
                <span className="text-[var(--color-text)] truncate max-w-[200px]">{project}</span>
                <span className="text-[var(--color-text-muted)] shrink-0">{issues}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 sm:p-6">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Weeks ({annualData.weeks.length})</h3>
        <div className="flex flex-wrap gap-2">
          {annualData.weeks.map((w) => (
            <Link
              key={w}
              to={`/history/${w}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--color-surface-elevated)] hover:bg-primary-500/10 rounded-lg text-[var(--color-text)] hover:text-primary-500 transition-colors"
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
