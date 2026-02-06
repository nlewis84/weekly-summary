import { WeeklyTicker } from "./WeeklyTicker";
import { WeeklyTickerSkeleton } from "./WeeklyTickerSkeleton";
import { ErrorBanner } from "./ErrorBanner";
import type { Stats } from "../../lib/types";
import type { WeeklyGoals } from "../hooks/useGoals";

interface WeeklySectionProps {
  stats: Stats | null;
  prevStats?: Stats | null;
  error: string | null;
  isLoading?: boolean;
  goals?: WeeklyGoals;
}

export function WeeklySection({
  stats,
  prevStats,
  error,
  isLoading,
  goals,
}: WeeklySectionProps) {
  if (!stats && !error && !isLoading) return null;

  return (
    <div className="space-y-4 xl:flex xl:flex-col xl:flex-1 xl:min-h-0">
      {error && <ErrorBanner message={`Weekly: ${error}`} />}
      {stats ? (
        <div
          className={`xl:flex-1 xl:min-h-0 xl:flex xl:flex-col transition-opacity ${
            isLoading ? "opacity-90" : "opacity-100"
          }`}
        >
          <WeeklyTicker
            stats={stats}
            prevStats={prevStats ?? null}
            goals={goals}
          />
        </div>
      ) : isLoading ? (
        <div className="xl:flex-1 xl:min-h-0 xl:flex xl:flex-col">
          <WeeklyTickerSkeleton />
        </div>
      ) : null}
    </div>
  );
}
