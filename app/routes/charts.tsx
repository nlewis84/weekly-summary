import { Suspense, lazy } from "react";
import { useLoaderData, useRouteError, isRouteErrorResponse, Link } from "react-router";
import { useToast } from "../components/Toast";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { getChartsData } from "../../lib/charts-data";
import { useRevalidator } from "react-router";
import { ErrorBanner } from "../components/ErrorBanner";

const ChartsContent = lazy(() =>
  import("../components/ChartsContent").then((m) => ({ default: m.ChartsContent }))
);

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
      <h2 className="text-lg font-semibold text-[var(--color-text)]">Progress Charts</h2>
      <div className="p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-xl text-[var(--color-error-500)]">
        <p className="mb-4">{message}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-3 py-2 bg-[var(--color-error-bg)] hover:opacity-90 rounded-lg font-medium border border-[var(--color-error-border)]"
          >
            Retry
          </button>
          <Link to="/" className="px-3 py-2 bg-[var(--color-surface-elevated)] hover:opacity-90 rounded-lg font-medium border border-[var(--color-border)] text-[var(--color-text)]">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed", dataPoints: [], repoActivity: [] });
  }

  try {
    const chartData = await getChartsData();
    return data({ ...chartData, error: null as string | null });
  } catch (err) {
    console.error("Charts loader error:", err);
    return data({
      error: (err as Error).message,
      dataPoints: [],
      repoActivity: [],
    });
  }
}

const formatWeek = (w: string) => {
  const d = new Date(w);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function Charts() {
  const revalidator = useRevalidator();
  const toast = useToast();
  const { dataPoints, repoActivity, error } = useLoaderData<typeof loader>() as {
    dataPoints: Awaited<ReturnType<typeof getChartsData>>["dataPoints"];
    repoActivity: Awaited<ReturnType<typeof getChartsData>>["repoActivity"];
    error: string | null;
  };

  const metricsData = dataPoints.map((d) => ({
    week: formatWeek(d.week_ending),
    "PRs merged": d.prs_merged,
    "PR reviews": d.pr_reviews,
    "Linear completed": d.linear_completed,
    "Linear worked on": d.linear_worked_on,
    "PRs total": d.prs_total,
    Repos: d.repos_count,
  }));

  const handleExportCsv = () => {
    const headers = ["Week", "PRs merged", "PR reviews", "Linear completed", "Linear worked on"];
    const rows = metricsData.map((d) =>
      [d.week, d["PRs merged"], d["PR reviews"], d["Linear completed"], d["Linear worked on"]].join(",")
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
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Progress Charts</h2>
        {dataPoints.length > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="min-h-[44px] px-3 py-2 text-sm text-primary-500 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={() => revalidator.revalidate()} />
      )}

      {dataPoints.length === 0 && !error ? (
        <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] p-8 text-center text-[var(--color-text-muted)] border border-[var(--color-border)]">
          No data available for charts. Generate summaries with Build Summary to populate.
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-8 animate-pulse h-72" />
          }
        >
          <ChartsContent dataPoints={dataPoints} repoActivity={repoActivity} />
        </Suspense>
      )}
    </div>
  );
}
