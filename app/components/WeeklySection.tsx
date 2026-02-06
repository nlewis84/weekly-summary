import { WeeklyTicker } from "./WeeklyTicker";
import { WeeklyTickerSkeleton } from "./WeeklyTickerSkeleton";
import { ErrorBanner } from "./ErrorBanner";
import type { Stats } from "../../lib/types";

interface WeeklySectionProps {
  stats: Stats | null;
  prevStats?: Stats | null;
  error: string | null;
  isLoading?: boolean;
}

export function WeeklySection({ stats, prevStats, error, isLoading }: WeeklySectionProps) {
  if (!stats && !error && !isLoading) return null;

  return (
    <>
      {error && <ErrorBanner message={`Weekly: ${error}`} />}
      {stats ? (
        <div className="mt-4">
          <WeeklyTicker stats={stats} prevStats={prevStats ?? null} />
        </div>
      ) : isLoading ? (
        <div className="mt-4">
          <WeeklyTickerSkeleton />
        </div>
      ) : null}
    </>
  );
}
