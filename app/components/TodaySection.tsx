import { MetricsCard } from "./MetricsCard";
import { MetricsCardSkeleton } from "./MetricsCardSkeleton";
import { RefreshButton } from "./RefreshButton";
import { ErrorBanner } from "./ErrorBanner";
import type { Payload } from "../../lib/types";

interface TodaySectionProps {
  payload: Payload | null;
  error: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function TodaySection({ payload, error, isLoading, onRefresh }: TodaySectionProps) {
  const stats = payload?.stats ?? null;

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">Today</h2>
        <RefreshButton onClick={onRefresh} isLoading={isLoading} />
      </div>

      {error && <ErrorBanner message={error} />}

      {stats ? (
        <MetricsCard stats={stats} payload={payload} />
      ) : isLoading && !stats ? (
        <MetricsCardSkeleton />
      ) : null}
    </>
  );
}
