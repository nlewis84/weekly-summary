import { useLoaderData, Link, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { getAnnualData, getAvailableYears } from "../../lib/annual-data";
import { ArrowLeft, CalendarBlank } from "phosphor-react";
import { Suspense } from "react";
import { AnnualChartsContent } from "../components/AnnualChartsContent";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const year = url.searchParams.get("year") ?? new Date().getFullYear().toString();

  try {
    const [annualData, years] = await Promise.all([getAnnualData(year), getAvailableYears()]);
    return data({ annualData, years, error: null as string | null });
  } catch (err) {
    console.error("Annual loader error:", err);
    return data({
      annualData: null,
      years: [],
      error: (err as Error).message,
    });
  }
}

export default function HistoryAnnual() {
  const { annualData, years, error } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const year = searchParams.get("year") ?? annualData?.year ?? new Date().getFullYear().toString();

  const handleYearChange = (y: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("year", y);
    setSearchParams(next);
  };

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
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Annual Dashboard — {annualData.year}</h2>
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
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">PRs merged</p>
          <p className="text-xl font-semibold text-primary-500">{annualData.total_prs_merged}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">PR reviews</p>
          <p className="text-xl font-semibold text-primary-500">{annualData.total_pr_reviews}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Linear completed</p>
          <p className="text-xl font-semibold text-primary-500">{annualData.total_linear_completed}</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <p className="text-xs text-[var(--color-text-muted)]">Linear worked on</p>
          <p className="text-xl font-semibold text-primary-500">{annualData.total_linear_worked_on}</p>
        </div>
      </div>

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
