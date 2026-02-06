import { useEffect } from "react";
import { useLoaderData, Link, useSearchParams, useRevalidator } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { fetchWeeklySummary } from "../../lib/github-fetch";
import { listWeeklySummaries } from "../../lib/github-fetch";
import { ArrowLeft, CaretUp, CaretDown, Minus } from "phosphor-react";
import { ErrorBanner } from "../components/ErrorBanner";
import type { Payload } from "../../lib/types";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const week1 = url.searchParams.get("week1");
  const week2 = url.searchParams.get("week2");
  const bust = !!url.searchParams.get("_bust");

  if (!week1 || !week2 || !/^\d{4}-\d{2}-\d{2}$/.test(week1) || !/^\d{4}-\d{2}-\d{2}$/.test(week2)) {
    const weeks = await listWeeklySummaries({ bust }).catch(() => []);
    return data({ payload1: null, payload2: null, weeks, error: null as string | null });
  }

  try {
    const [payload1, payload2] = await Promise.all([
      fetchWeeklySummary(week1, { bust }),
      fetchWeeklySummary(week2, { bust }),
    ]);
    const weeks = await listWeeklySummaries({ bust }).catch(() => []);
    return data({ payload1, payload2, weeks, error: null as string | null });
  } catch (err) {
    console.error("Compare loader error:", err);
    return data({
      payload1: null,
      payload2: null,
      weeks: [],
      error: (err as Error).message,
    });
  }
}

function formatWeekLabel(weekEnding: string): string {
  const d = new Date(weekEnding);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <Minus size={14} weight="bold" className="text-(--color-text-muted)" />;
  if (delta > 0) return <CaretUp size={14} weight="bold" className="text-emerald-600 dark:text-emerald-400" />;
  return <CaretDown size={14} weight="bold" className="text-amber-600 dark:text-amber-400" />;
}

const METRIC_KEYS = ["prs_merged", "prs_total", "pr_reviews", "linear_completed", "linear_worked_on", "linear_issues_created"] as const;
const METRIC_LABELS: Record<(typeof METRIC_KEYS)[number], string> = {
  prs_merged: "PRs merged",
  prs_total: "PRs created/updated",
  pr_reviews: "PR reviews",
  linear_completed: "Linear completed",
  linear_worked_on: "Linear worked on",
  linear_issues_created: "Linear issues created",
};

export default function HistoryCompare() {
  const { payload1, payload2, weeks, error } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const revalidator = useRevalidator();

  // Strip _bust from URL after load to keep URL clean
  useEffect(() => {
    if (searchParams.get("_bust") && revalidator.state !== "loading") {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("_bust");
        return next.size ? next : new URLSearchParams();
      });
    }
  }, [searchParams, revalidator.state, setSearchParams]);

  const week1 = searchParams.get("week1") ?? "";
  const week2 = searchParams.get("week2") ?? "";

  const handleWeek1Change = (w: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("week1", w);
    setSearchParams(next);
  };
  const handleWeek2Change = (w: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("week2", w);
    setSearchParams(next);
  };

  const s1 = payload1?.stats;
  const s2 = payload2?.stats;

  return (
    <div className="space-y-6">
      <Link
        to="/history"
        prefetch="intent"
        className="inline-flex items-center gap-2 text-sm text-(--color-text-muted) hover:text-primary-500 transition-colors"
      >
        <ArrowLeft size={18} weight="regular" />
        Back to History
      </Link>

      <h2 className="text-lg font-semibold text-(--color-text)">Compare Weeks</h2>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-(--color-text-muted) mb-2">Week 1</label>
          <select
            value={week1}
            onChange={(e) => handleWeek1Change(e.target.value)}
            className="w-full px-4 py-2 bg-(--color-surface-elevated) border border-(--color-border) rounded-lg text-(--color-text) focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select week…</option>
            {weeks.map((w) => (
              <option key={w} value={w}>
                {formatWeekLabel(w)} ({w})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-(--color-text-muted) mb-2">Week 2</label>
          <select
            value={week2}
            onChange={(e) => handleWeek2Change(e.target.value)}
            className="w-full px-4 py-2 bg-(--color-surface-elevated) border border-(--color-border) rounded-lg text-(--color-text) focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select week…</option>
            {weeks.map((w) => (
              <option key={w} value={w}>
                {formatWeekLabel(w)} ({w})
              </option>
            ))}
          </select>
        </div>
      </div>

      {s1 && s2 ? (
        <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--color-border)">
                  <th className="text-left py-3 px-4 font-medium text-(--color-text-muted)">Metric</th>
                  <th className="text-right py-3 px-4 font-medium text-(--color-text)">
                    {week1 ? formatWeekLabel(week1) : "—"}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-(--color-text)">
                    {week2 ? formatWeekLabel(week2) : "—"}
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-(--color-text-muted)">Δ</th>
                </tr>
              </thead>
              <tbody>
                {METRIC_KEYS.map((key) => {
                  const v1 = (s1[key] as number | undefined) ?? 0;
                  const v2 = (s2[key] as number | undefined) ?? 0;
                  const delta = v2 - v1;
                  return (
                    <tr key={key} className="border-b border-(--color-border) last:border-0">
                      <td className="py-3 px-4 text-(--color-text-muted)">{METRIC_LABELS[key]}</td>
                      <td className="py-3 px-4 text-right font-medium text-(--color-text)">{v1}</td>
                      <td className="py-3 px-4 text-right font-medium text-(--color-text)">{v2}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1">
                          <DeltaBadge delta={delta} />
                          {delta !== 0 && (
                            <span className={delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}>
                              {delta > 0 ? `+${delta}` : delta}
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-b border-(--color-border) last:border-0">
                  <td className="py-3 px-4 text-(--color-text-muted)">Repos</td>
                  <td className="py-3 px-4 text-right font-medium text-(--color-text)">{s1.repos.join(", ") || "—"}</td>
                  <td className="py-3 px-4 text-right font-medium text-(--color-text)">{s2.repos.join(", ") || "—"}</td>
                  <td className="py-3 px-4 text-right text-(--color-text-muted)">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) p-8 text-center text-(--color-text-muted) border border-(--color-border)">
          Select two weeks to compare. {!week1 && !week2 && "Both weeks need a JSON summary (not transcript-only)."}
        </div>
      )}
    </div>
  );
}
