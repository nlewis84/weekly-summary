import { useEffect, useRef, useState } from "react";
import { useLoaderData, useRevalidator } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { runSummary } from "../../lib/summary";
import { fetchWeeklySummary } from "../../lib/github-fetch";
import { TodaySection } from "~/components/TodaySection";
import { WeeklySection } from "~/components/WeeklySection";
import { FullSummaryFormContainer } from "~/components/FullSummaryFormContainer";
import { useRefreshInterval } from "~/hooks/useRefreshInterval";
import { useGoals } from "~/hooks/useGoals";
import type { Payload } from "../../lib/types";

function getPrevWeekEnding(weekEnding: string): string {
  const d = new Date(weekEnding + "T12:00:00Z");
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

type ViewMode = "today" | "yesterday";

interface IndexLoaderData {
  today: { payload?: Payload; error?: string };
  yesterday: { payload?: Payload; error?: string };
  weekly: { payload?: Payload; prevPayload?: Payload | null; error?: string };
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data(
      {
        today: { error: "Method not allowed" },
        weekly: { error: "Method not allowed" },
      },
      { status: 405 }
    );
  }

  const runToday = () =>
    runSummary({ todayMode: true, checkInsText: "", outputDir: null }).then(
      (r) => ({ payload: r.payload }),
      (err) => {
        console.error("Today summary error:", err);
        return { error: (err as Error).message };
      }
    );

  const runYesterday = () =>
    runSummary({
      todayMode: false,
      yesterdayMode: true,
      checkInsText: "",
      outputDir: null,
    }).then(
      (r) => ({ payload: r.payload }),
      (err) => {
        console.error("Yesterday summary error:", err);
        return { error: (err as Error).message };
      }
    );

  const runWeekly = () =>
    runSummary({ todayMode: false, checkInsText: "", outputDir: null }).then(
      async (r) => {
        const prevWeekEnding = getPrevWeekEnding(r.payload.meta.week_ending);
        let prevPayload: Payload | null = null;
        try {
          prevPayload = await fetchWeeklySummary(prevWeekEnding);
        } catch {
          // No previous week; trend badges will not show
        }
        return { payload: r.payload, prevPayload };
      },
      (err) => {
        console.error("Weekly summary error:", err);
        return { error: (err as Error).message };
      }
    );

  const [today, yesterday, weekly] = await Promise.all([
    runToday(),
    runYesterday(),
    runWeekly(),
  ]);

  return data({ today, yesterday, weekly } satisfies IndexLoaderData);
}

export default function Index() {
  const { today, yesterday, weekly } = useLoaderData<typeof loader>();
  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const revalidator = useRevalidator();
  const { intervalMs, label } = useRefreshInterval();
  const { goals } = useGoals();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRefresh = () => {
    revalidator.revalidate();
  };

  useEffect(() => {
    if (intervalMs === null) return;
    intervalRef.current = setInterval(handleRefresh, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [intervalMs, revalidator.revalidate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable]")) return;
      if (
        e.key === "r" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        e.preventDefault();
        revalidator.revalidate();
      }
      if (
        e.key === "y" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        e.preventDefault();
        setViewMode("yesterday");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [revalidator]);

  const isLoading = revalidator.state === "loading";

  const todayPayload = today && "payload" in today ? today.payload : null;
  const todayError = today && "error" in today ? today.error : null;
  const yesterdayPayload =
    yesterday && "payload" in yesterday ? yesterday.payload : null;
  const yesterdayError =
    yesterday && "error" in yesterday ? yesterday.error : null;
  const weeklyPayload = weekly && "payload" in weekly ? weekly.payload : null;
  const weeklyError = weekly && "error" in weekly ? weekly.error : null;

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="Date range"
        className="flex w-fit rounded-lg border border-[var(--color-border)] p-0.5 bg-[var(--color-surface-elevated)]"
      >
        {(["today", "yesterday"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={viewMode === mode}
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
              viewMode === mode
                ? "bg-primary-600 text-white shadow-sm hover:bg-primary-500"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <div className="xl:grid xl:grid-cols-[2fr_1fr_1fr] xl:gap-5 xl:items-stretch">
        <div className="space-y-6 xl:flex xl:flex-col xl:min-h-0">
          {viewMode === "today" && (
            <TodaySection
              payload={todayPayload ?? null}
              error={todayError ?? null}
              isLoading={isLoading && !todayPayload}
              onRefresh={handleRefresh}
              refreshIntervalLabel={label}
              title="Today"
              goals={goals}
            />
          )}
          {viewMode === "yesterday" && (
            <TodaySection
              payload={yesterdayPayload ?? null}
              error={yesterdayError ?? null}
              isLoading={isLoading && !yesterdayPayload}
              onRefresh={handleRefresh}
              refreshIntervalLabel={label}
              title="Yesterday"
              goals={goals}
            />
          )}
        </div>

        <div id="build-summary" className="xl:sticky xl:top-6 xl:flex xl:flex-col xl:items-start xl:min-h-0">
          <FullSummaryFormContainer />
        </div>

        <div className="xl:flex xl:flex-col xl:min-h-0">
          <WeeklySection
            stats={weeklyPayload?.stats ?? null}
            prevStats={
              weekly && "prevPayload" in weekly
                ? (weekly.prevPayload?.stats ?? null)
                : null
            }
            error={weeklyError ?? null}
            isLoading={isLoading && !weeklyPayload}
            goals={goals}
          />
        </div>
      </div>
    </div>
  );
}
