import { Suspense, lazy, useEffect } from "react";
import {
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
  Link,
  useSearchParams,
} from "react-router";
import { useToast } from "../components/Toast";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { getChartsData } from "../../lib/charts-data";
import { getAnnualData, getAvailableYears } from "../../lib/annual-data";
import { useNavigation } from "react-router";
import { ErrorBanner } from "../components/ErrorBanner";
import { RefreshButton } from "../components/RefreshButton";
import { AnnualChartsSection } from "../components/AnnualChartsSection";

const ChartsContent = lazy(() =>
  import("../components/ChartsContent").then((m) => ({
    default: m.ChartsContent,
  }))
);

type ViewMode = "weekly" | "annual";

export function ErrorBoundary() {
  const error = useRouteError();
  if (typeof window !== "undefined") console.error("Charts error:", error);
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Charts failed to load";
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-(--color-text)">
        Progress Charts
      </h2>
      <div className="p-4 bg-error-bg border border-error-border rounded-xl text-error-500">
        <p className="mb-4">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-2 bg-error-bg hover:opacity-90 rounded-lg font-medium border border-error-border"
          >
            Retry
          </button>
          <Link
            to="/"
            prefetch="intent"
            className="px-3 py-2 bg-surface-elevated hover:opacity-90 rounded-lg font-medium border border-(--color-border) text-(--color-text)"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({
      error: "Method not allowed",
      dataPoints: [],
      repoActivity: [],
      annualData: null,
      compareData: null,
      years: [],
      annualError: null,
    });
  }

  const url = new URL(request.url);
  const view = (url.searchParams.get("view") ?? "weekly") as ViewMode;
  const year =
    url.searchParams.get("year") ?? new Date().getFullYear().toString();
  const compareYear = url.searchParams.get("compare") ?? null;
  const bust = !!url.searchParams.get("_bust");

  try {
    const chartData = await getChartsData({ bust });
    let annualData = null;
    let compareData = null;
    let years: string[] = [];
    let annualError: string | null = null;

    if (view === "annual") {
      try {
        [annualData, years, compareData] = await Promise.all([
          getAnnualData(year, { bust }),
          getAvailableYears({ bust }),
          compareYear && compareYear !== year
            ? getAnnualData(compareYear, { bust })
            : Promise.resolve(null),
        ]);
      } catch (err) {
        console.error("Annual data error:", err);
        annualError = (err as Error).message;
      }
    }

    return data({
      ...chartData,
      error: null as string | null,
      annualData,
      compareData,
      years,
      annualError,
    });
  } catch (err) {
    console.error("Charts loader error:", err);
    return data({
      error: (err as Error).message,
      dataPoints: [],
      repoActivity: [],
      annualData: null,
      compareData: null,
      years: [],
      annualError: null,
    });
  }
}

const formatWeek = (w: string) => {
  const d = new Date(w);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function Charts() {
  const navigation = useNavigation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const loaderData = useLoaderData<typeof loader>() as {
    dataPoints: Awaited<ReturnType<typeof getChartsData>>["dataPoints"];
    repoActivity: Awaited<ReturnType<typeof getChartsData>>["repoActivity"];
    error: string | null;
    annualData: Awaited<
      ReturnType<typeof import("../../lib/annual-data").getAnnualData>
    > | null;
    compareData: Awaited<
      ReturnType<typeof import("../../lib/annual-data").getAnnualData>
    > | null;
    years: string[];
    annualError: string | null;
  };

  const {
    dataPoints,
    repoActivity,
    error,
    annualData,
    compareData,
    years,
    annualError,
  } = loaderData;

  const view = (searchParams.get("view") ?? "weekly") as ViewMode;
  const year =
    searchParams.get("year") ??
    annualData?.year ??
    new Date().getFullYear().toString();
  const compareYear = searchParams.get("compare") ?? "";

  const setView = (v: ViewMode) => {
    const next = new URLSearchParams(searchParams);
    next.set("view", v);
    if (v === "annual") {
      next.set("year", year);
      if (compareYear) next.set("compare", compareYear);
    } else {
      next.delete("year");
      next.delete("compare");
    }
    setSearchParams(next);
  };

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

  const metricsData = dataPoints.map((d) => ({
    week: formatWeek(d.week_ending),
    "PRs merged": d.prs_merged,
    "PR reviews": d.pr_reviews,
    "PR comments": d.pr_comments,
    "Commits pushed": d.commits_pushed,
    "Linear completed": d.linear_completed,
    "Linear worked on": d.linear_worked_on,
    "Linear issues created": d.linear_issues_created ?? 0,
    "PRs total": d.prs_total,
    Repos: d.repos_count,
  }));

  const handleExportCsv = () => {
    if (view === "annual" && annualData) {
      const headers = [
        "Month",
        "PRs merged",
        "PR reviews",
        "PR comments",
        "Commits pushed",
        "Linear completed",
        "Linear worked on",
        "Linear issues created",
      ];
      const rows = annualData.months.map((m) =>
        [
          m.label,
          m.prs_merged,
          m.pr_reviews,
          m.pr_comments,
          m.commits_pushed,
          m.linear_completed,
          m.linear_worked_on,
          m.linear_issues_created,
        ].join(",")
      );
      const totalsRow = [
        "Total",
        annualData.total_prs_merged,
        annualData.total_pr_reviews,
        annualData.total_pr_comments,
        annualData.total_commits_pushed,
        annualData.total_linear_completed,
        annualData.total_linear_worked_on,
        annualData.total_linear_issues_created,
      ].join(",");
      const csv = [headers.join(","), ...rows, totalsRow].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `annual-metrics-${annualData.year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast("CSV exported");
    } else {
      const headers = [
        "Week",
        "PRs merged",
        "PR reviews",
        "PR comments",
        "Commits pushed",
        "Linear completed",
        "Linear worked on",
        "Linear issues created",
      ];
      const rows = metricsData.map((d) =>
        [
          d.week,
          d["PRs merged"],
          d["PR reviews"],
          d["PR comments"],
          d["Commits pushed"],
          d["Linear completed"],
          d["Linear worked on"],
          d["Linear issues created"] ?? 0,
        ].join(",")
      );
      const csv = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `weekly-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast("CSV exported");
    }
  };

  const showExportCsv =
    (view === "weekly" && dataPoints.length > 0) ||
    (view === "annual" && annualData);

  // Strip _bust from URL after load to keep URL clean; toast on refresh complete
  useEffect(() => {
    if (searchParams.get("_bust") && navigation.state !== "loading") {
      toast("Data refreshed");
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("_bust");
        return next.size ? next : new URLSearchParams();
      });
    }
  }, [searchParams, navigation.state, setSearchParams, toast]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg font-semibold text-(--color-text)">
            Progress Charts
          </h2>
          <div
            role="tablist"
            aria-label="Charts view"
            className="flex rounded-lg border border-(--color-border) p-0.5 bg-surface-elevated"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "weekly"}
              aria-controls="charts-panel"
              id="charts-tab-weekly"
              onClick={() => setView("weekly")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === "weekly"
                  ? "bg-surface text-(--color-text) shadow-sm"
                  : "text-text-muted hover:text-(--color-text)"
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "annual"}
              aria-controls="charts-panel"
              id="charts-tab-annual"
              onClick={() => setView("annual")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === "annual"
                  ? "bg-surface text-(--color-text) shadow-sm"
                  : "text-text-muted hover:text-(--color-text)"
              }`}
            >
              Annual
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton
            onClick={() => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.set("_bust", Date.now().toString());
                return next;
              });
            }}
            isLoading={navigation.state === "loading"}
          />
          {showExportCsv && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="min-h-[44px] px-3 py-2 text-sm text-primary-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("_bust", Date.now().toString());
              return next;
            });
          }}
        />
      )}

      {view === "annual" && annualError && (
        <ErrorBanner
          message={annualError}
          onRetry={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("_bust", Date.now().toString());
              return next;
            });
          }}
        />
      )}

      <div
        id="charts-panel"
        role="tabpanel"
        aria-labelledby={
          view === "weekly" ? "charts-tab-weekly" : "charts-tab-annual"
        }
      >
        {view === "weekly" ? (
          dataPoints.length === 0 && !error ? (
            <div className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) p-8 text-center text-text-muted border border-(--color-border)">
              No data available for charts. Generate summaries with Build
              Summary to populate.
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="bg-surface rounded-xl border border-(--color-border) p-8 animate-pulse h-72" />
              }
            >
              <ChartsContent
                dataPoints={dataPoints}
                repoActivity={repoActivity}
              />
            </Suspense>
          )
        ) : annualData ? (
          <AnnualChartsSection
            annualData={annualData}
            compareData={compareData}
            years={years}
            year={year}
            compareYear={compareYear}
            onYearChange={handleYearChange}
            onCompareChange={handleCompareChange}
            showBackLink={false}
          />
        ) : annualError ? null : (
          <div className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) p-8 text-center text-text-muted border border-(--color-border)">
            No data for {year}. Generate summaries with Build Summary to
            populate.
          </div>
        )}
      </div>
    </div>
  );
}
