import { useEffect, useRef } from "react";
import { useLoaderData, useFetcher } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { runSummary } from "../../lib/summary";
import { TodaySection } from "~/components/TodaySection";
import { WeeklySection } from "~/components/WeeklySection";
import { FullSummaryFormContainer } from "~/components/FullSummaryFormContainer";
import type { Payload } from "../../lib/types";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface IndexLoaderData {
  today: { payload?: Payload; error?: string };
  weekly: { payload?: Payload; error?: string };
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
      (r) => ({ payload: r.payload }),
      (err) => {
        console.error("Weekly summary error:", err);
        return { error: (err as Error).message };
      }
    );

  const [today, weekly] = await Promise.all([runToday(), runWeekly()]);

  return data({ today, weekly } satisfies IndexLoaderData);
}

type ApiPayload = { payload?: Payload; error?: string };

export default function Index() {
  const { today, weekly } = useLoaderData<typeof loader>();
  const todayFetcher = useFetcher<ApiPayload>();
  const weeklyFetcher = useFetcher<ApiPayload>();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRefresh = () => {
    todayFetcher.load("/api/today");
    weeklyFetcher.load("/api/weekly");
  };

  useEffect(() => {
    intervalRef.current = setInterval(handleRefresh, REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const isLoading = todayFetcher.state === "loading" || weeklyFetcher.state === "loading";
  const displayToday = todayFetcher.data ?? today;
  const displayWeekly = weeklyFetcher.data ?? weekly;

  return (
    <div className="space-y-6">
      <TodaySection
        payload={displayToday?.payload ?? null}
        error={displayToday?.error ?? null}
        isLoading={isLoading && !today.payload}
        onRefresh={handleRefresh}
      />

      <WeeklySection stats={displayWeekly?.payload?.stats ?? null} error={displayWeekly?.error ?? null} />

      <FullSummaryFormContainer />
    </div>
  );
}
