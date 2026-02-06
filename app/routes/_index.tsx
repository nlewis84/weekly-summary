import { useEffect, useRef } from "react";
import { useLoaderData, useRevalidator } from "react-router";
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

      <WeeklySection stats={weeklyPayload?.stats ?? null} error={weeklyError ?? null} />
    </div>
  );
}
