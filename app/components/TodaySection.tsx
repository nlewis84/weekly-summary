import { MetricsCard } from "./MetricsCard";
import { MetricsCardSkeleton } from "./MetricsCardSkeleton";
import { RefreshButton } from "./RefreshButton";
import { ErrorBanner } from "./ErrorBanner";
import type { Payload } from "../../lib/types";
import type { WeeklyGoals } from "../hooks/useGoals";

interface TodaySectionProps {
  payload: Payload | null;
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
  refreshIntervalLabel?: string;
  title?: string;
  goals?: WeeklyGoals;
}

export function TodaySection({
  payload,
  error,
  isLoading,
  onRefresh,
  refreshIntervalLabel,
  title = "Today",
  goals,
}: TodaySectionProps) {
  const stats = payload?.stats ?? null;

  return (
    <div className="xl:flex xl:flex-col xl:min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold text-(--color-text)">{title}</h2>
        <div className="flex items-center gap-2">
          {refreshIntervalLabel && refreshIntervalLabel !== "Off" && (
            <span className="text-xs text-text-muted">
              Refreshes every {refreshIntervalLabel}
            </span>
          )}
          <RefreshButton onClick={onRefresh} isLoading={isLoading} />
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      {stats ? (
        <div
          className={`xl:flex-1 xl:min-h-0 xl:flex xl:flex-col transition-opacity ${
            isLoading ? "opacity-90" : "opacity-100"
          }`}
        >
          <MetricsCard stats={stats} payload={payload} goals={goals} />
        </div>
      ) : isLoading && !stats ? (
        <div className="xl:flex-1 xl:min-h-0">
          <MetricsCardSkeleton />
        </div>
      ) : null}
    </div>
  );
}
