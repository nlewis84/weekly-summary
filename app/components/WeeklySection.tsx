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

export function WeeklySection({ stats, prevStats, error, isLoading, goals }: WeeklySectionProps) {
  if (!stats && !error && !isLoading) return null;

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={`Weekly: ${error}`} />}
      {stats ? (
        <WeeklyTicker stats={stats} prevStats={prevStats ?? null} goals={goals} />
      ) : isLoading ? (
        <WeeklyTickerSkeleton />
      ) : null}
    </div>
  );
}
