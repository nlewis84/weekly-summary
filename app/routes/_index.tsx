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
    return data({ today: { error: "Method not allowed" }, weekly: { error: "Method not allowed" } }, { status: 405 });
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
    runSummary({ todayMode: false, yesterdayMode: true, checkInsText: "", outputDir: null }).then(
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

  const [today, yesterday, weekly] = await Promise.all([runToday(), runYesterday(), runWeekly()]);

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
      if (e.key === "r" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        revalidator.revalidate();
      }
      if (e.key === "y" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
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
  const yesterdayPayload = yesterday && "payload" in yesterday ? yesterday.payload : null;
  const yesterdayError = yesterday && "error" in yesterday ? yesterday.error : null;
  const weeklyPayload = weekly && "payload" in weekly ? weekly.payload : null;
  const weeklyError = weekly && "error" in weekly ? weekly.error : null;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {(["today", "yesterday"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              viewMode === mode
                ? "bg-[var(--color-primary)] text-white"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

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

      <div id="build-summary">
        <FullSummaryFormContainer />
      </div>

      <WeeklySection
        stats={weeklyPayload?.stats ?? null}
        prevStats={weekly && "prevPayload" in weekly ? weekly.prevPayload?.stats ?? null : null}
        error={weeklyError ?? null}
        isLoading={isLoading && !weeklyPayload}
        goals={goals}
      />
    </div>
  );
}
