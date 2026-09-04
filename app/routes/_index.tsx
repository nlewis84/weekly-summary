import { Suspense, useCallback, useEffect, useRef } from "react";
import {
  Await,
  data,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "react-router";
import { useToast } from "~/components/Toast";
import type { LoaderFunctionArgs } from "react-router";
import { getCachedRunSummary } from "../../lib/summary";
import {
  currentMonth,
  getMonthlyProgress,
  type MonthlyProgress,
} from "../../lib/monthly-progress";
import { fetchWeeklySummary } from "../../lib/github-fetch";
import { listDailySnapshots } from "../../lib/daily-snapshot";
import { isBasecampConfigured } from "../../lib/basecamp-post";
import { isGranolaConfigured } from "../../lib/granola-client";
import { TodaySection } from "~/components/TodaySection";
import { PeriodSummaryCard } from "~/components/PeriodSummaryCard";
import { FullSummaryFormContainer } from "~/components/FullSummaryFormContainer";
import { useRefreshInterval } from "~/hooks/useRefreshInterval";
import { useGoals } from "~/hooks/useGoals";
import { useMonthlyPrTarget } from "~/hooks/useMonthlyGoal";
import type { Payload } from "../../lib/types";

function getPrevWeekEnding(weekEnding: string): string {
  const d = new Date(weekEnding + "T12:00:00Z");
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

type TodayResult = { payload?: Payload; error?: string };
type WeeklyResult = {
  payload?: Payload;
  prevPayload?: Payload | null;
  error?: string;
};
type MonthlyResult = { progress?: MonthlyProgress; error?: string };

interface DashboardData {
  today: TodayResult;
  weekly: WeeklyResult;
  monthly: MonthlyResult;
  capturedDates: string[];
}

function emptyDashboard(error: string): DashboardData {
  return {
    today: { error },
    weekly: { error },
    monthly: { error },
    capturedDates: [],
  };
}

function runToday(bust: boolean): Promise<TodayResult> {
  return getCachedRunSummary({
    todayMode: true,
    checkInsText: "",
    outputDir: null,
    bust,
  }).then(
    (r) => ({ payload: r.payload }),
    (err) => {
      console.error("Today summary error:", err);
      return { error: (err as Error).message };
    }
  );
}

function runWeekly(bust: boolean): Promise<WeeklyResult> {
  return getCachedRunSummary({
    todayMode: false,
    checkInsText: "",
    outputDir: null,
    bust,
  }).then(
    async (r) => {
      const prevWeekEnding = getPrevWeekEnding(r.payload.meta.week_ending);
      let prevPayload: Payload | null = null;
      try {
        prevPayload = await fetchWeeklySummary(prevWeekEnding, { bust });
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
}

function runMonthly(bust: boolean): Promise<MonthlyResult> {
  return getMonthlyProgress(currentMonth(new Date()), { bust }).then(
    (progress) => ({ progress }),
    (err) => {
      console.error("Monthly progress error:", err);
      return { error: (err as Error).message };
    }
  );
}

function loadDashboard(bust: boolean): Promise<DashboardData> {
  return Promise.all([runToday(bust), runWeekly(bust), runMonthly(bust)]).then(
    ([today, weekly, monthly]) => {
      let capturedDates: string[] = [];
      try {
        const weekEnding =
          weekly && "payload" in weekly
            ? weekly.payload?.meta.week_ending
            : undefined;
        if (weekEnding) {
          capturedDates = listDailySnapshots(weekEnding).map((s) => s.date);
        }
      } catch {
        // Snapshot listing is best-effort
      }
      return { today, weekly, monthly, capturedDates };
    }
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data(
      {
        dashboard: Promise.resolve(emptyDashboard("Method not allowed")),
        basecampConfigured: false,
        granolaConfigured: false,
      },
      { status: 405 }
    );
  }

  const url = new URL(request.url);
  const bust = !!url.searchParams.get("_bust");

  // Do not await GitHub/Linear here. Awaiting blocks the HTML until both
  // summaries finish, which is why the tab spins with no page.
  return {
    dashboard: loadDashboard(bust),
    basecampConfigured: isBasecampConfigured(),
    granolaConfigured: isGranolaConfigured(),
  };
}

export default function Index() {
  const { dashboard, basecampConfigured, granolaConfigured } =
    useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { intervalMs, label } = useRefreshInterval();
  const { goals } = useGoals();
  const { target: monthlyTarget } = useMonthlyPrTarget();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleRefresh = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("_bust", Date.now().toString());
      return next;
    });
  }, [setSearchParams]);

  useEffect(() => {
    if (intervalMs === null) return;
    intervalRef.current = setInterval(handleRefresh, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [intervalMs, handleRefresh]);

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
        handleRefresh();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRefresh]);

  const isLoading = navigation.state === "loading";

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

  const loadingCards = (
    <>
      <div className="space-y-6 xl:flex xl:flex-col xl:min-h-0">
        <TodaySection
          payload={null}
          error={null}
          isLoading
          onRefresh={handleRefresh}
          refreshIntervalLabel={label}
          capturedDates={[]}
          basecampConfigured={basecampConfigured}
          granolaConfigured={granolaConfigured}
        />
      </div>
      <div className="space-y-5 xl:flex xl:flex-col xl:min-h-0">
        <div id="build-summary" className="xl:shrink-0">
          <FullSummaryFormContainer basecampConfigured={basecampConfigured} />
        </div>
        <div className="xl:flex xl:flex-col xl:min-h-0">
          <PeriodSummaryCard
            weekStats={null}
            weekPrevStats={null}
            weekError={null}
            goals={goals}
            monthly={null}
            monthlyError={null}
            monthlyTarget={monthlyTarget}
            isLoading
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-5">
      <div className="xl:grid xl:grid-cols-[minmax(0,1.6fr)_minmax(20rem,1fr)] xl:gap-5 xl:items-start">
        <Suspense fallback={loadingCards}>
          <Await resolve={dashboard}>
            {(resolved) => {
              const todayPayload =
                resolved.today && "payload" in resolved.today
                  ? resolved.today.payload
                  : null;
              const todayError =
                resolved.today && "error" in resolved.today
                  ? resolved.today.error
                  : null;
              const weeklyPayload =
                resolved.weekly && "payload" in resolved.weekly
                  ? resolved.weekly.payload
                  : null;
              const weeklyError =
                resolved.weekly && "error" in resolved.weekly
                  ? resolved.weekly.error
                  : null;
              const monthlyProgress =
                resolved.monthly && "progress" in resolved.monthly
                  ? resolved.monthly.progress
                  : null;
              const monthlyError =
                resolved.monthly && "error" in resolved.monthly
                  ? resolved.monthly.error
                  : null;

              return (
                <>
                  <div className="space-y-6 xl:flex xl:flex-col xl:min-h-0">
                    <TodaySection
                      payload={todayPayload ?? null}
                      error={todayError ?? null}
                      isLoading={isLoading}
                      onRefresh={handleRefresh}
                      refreshIntervalLabel={label}
                      capturedDates={resolved.capturedDates}
                      basecampConfigured={basecampConfigured}
                      granolaConfigured={granolaConfigured}
                    />
                  </div>
                  <div className="space-y-5 xl:flex xl:flex-col xl:min-h-0">
                    <div id="build-summary" className="xl:shrink-0">
                      <FullSummaryFormContainer
                        basecampConfigured={basecampConfigured}
                      />
                    </div>
                    <div className="xl:flex xl:flex-col xl:min-h-0">
                      <PeriodSummaryCard
                        weekStats={weeklyPayload?.stats ?? null}
                        weekPrevStats={
                          resolved.weekly && "prevPayload" in resolved.weekly
                            ? (resolved.weekly.prevPayload?.stats ?? null)
                            : null
                        }
                        weekError={weeklyError ?? null}
                        goals={goals}
                        monthly={monthlyProgress ?? null}
                        monthlyError={monthlyError ?? null}
                        monthlyTarget={monthlyTarget}
                        isLoading={isLoading}
                      />
                    </div>
                  </div>
                </>
              );
            }}
          </Await>
        </Suspense>
      </div>
    </div>
  );
}
