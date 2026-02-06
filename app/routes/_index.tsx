import { useEffect, useRef } from "react";
import { useLoaderData, useRevalidator } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { runSummary } from "../../lib/summary";
import { fetchWeeklySummary } from "../../lib/github-fetch";
import { TodaySection } from "~/components/TodaySection";
import { WeeklySection } from "~/components/WeeklySection";
import { FullSummaryFormContainer } from "~/components/FullSummaryFormContainer";
import type { Payload } from "../../lib/types";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

function getPrevWeekEnding(weekEnding: string): string {
  const d = new Date(weekEnding + "T12:00:00Z");
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

interface IndexLoaderData {
  today: { payload?: Payload; error?: string };
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

  const [today, weekly] = await Promise.all([runToday(), runWeekly()]);

  return data({ today, weekly } satisfies IndexLoaderData);
}

export default function Index() {
  const { today, weekly } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRefresh = () => {
    revalidator.revalidate();
  };

  useEffect(() => {
    intervalRef.current = setInterval(handleRefresh, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [revalidator.revalidate]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (!target.closest("input, textarea, [contenteditable]")) {
          e.preventDefault();
          revalidator.revalidate();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [revalidator]);

  const isLoading = revalidator.state === "loading";

  const todayPayload = today && "payload" in today ? today.payload : null;
  const todayError = today && "error" in today ? today.error : null;
  const weeklyPayload = weekly && "payload" in weekly ? weekly.payload : null;
  const weeklyError = weekly && "error" in weekly ? weekly.error : null;

  return (
    <div className="space-y-6">
      <TodaySection
        payload={todayPayload ?? null}
        error={todayError ?? null}
        isLoading={isLoading && !todayPayload}
        onRefresh={handleRefresh}
      />

      <div id="build-summary">
        <FullSummaryFormContainer />
      </div>

      <WeeklySection
        stats={weeklyPayload?.stats ?? null}
        prevStats={weekly && "prevPayload" in weekly ? weekly.prevPayload?.stats ?? null : null}
        error={weeklyError ?? null}
        isLoading={isLoading && !weeklyPayload}
      />
    </div>
  );
}
