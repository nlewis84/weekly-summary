import { MetricsCard } from "./MetricsCard";
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
        <h2 className="text-lg font-semibold text-gray-900">Today</h2>
        <RefreshButton onClick={onRefresh} isLoading={isLoading} />
      </div>

      {error && <ErrorBanner message={error} />}

      {stats ? (
        <MetricsCard stats={stats} payload={payload} />
      ) : isLoading && !stats ? (
        <div className="bg-white rounded-xl shadow-[var(--shadow-skeuo-card)] p-8 text-center text-gray-500">
          Loading…
        </div>
      ) : null}
    </>
  );
}
