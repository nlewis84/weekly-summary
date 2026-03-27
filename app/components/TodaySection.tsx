import { useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { PushPin } from "phosphor-react";
import { MetricsCard } from "./MetricsCard";
import { MetricsCardSkeleton } from "./MetricsCardSkeleton";
import { RefreshButton } from "./RefreshButton";
import { ErrorBanner } from "./ErrorBanner";
import { useToast } from "./Toast";
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
  capturedDates?: string[];
}

export function TodaySection({
  payload,
  error,
  isLoading,
  onRefresh,
  refreshIntervalLabel,
  title = "Today",
  goals,
  capturedDates = [],
}: TodaySectionProps) {
  const stats = payload?.stats ?? null;
  const fetcher = useFetcher<{ ok?: boolean; date?: string; error?: string }>();
  const toast = useToast();
  const toastedRef = useRef(false);

  const isYesterday = title === "Yesterday";
  const captureDate = payload?.meta.window_start?.slice(0, 10) ?? "";
  const alreadyCaptured =
    capturedDates.includes(captureDate) ||
    (!!fetcher.data?.ok && fetcher.data.date === captureDate);
  const isCapturing = fetcher.state !== "idle";

  useEffect(() => {
    if (fetcher.data?.ok && !toastedRef.current) {
      toastedRef.current = true;
      const verb = alreadyCaptured ? "updated" : "captured";
      toast(`${isYesterday ? "Yesterday" : "Today"}'s data ${verb}`);
    }
    if (fetcher.state === "submitting") {
      toastedRef.current = false;
    }
  }, [fetcher.data, fetcher.state, isYesterday, alreadyCaptured, toast]);

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
          {stats && (
            <fetcher.Form method="post" action="/api/snapshot">
              <input
                type="hidden"
                name="mode"
                value={isYesterday ? "yesterday" : "today"}
              />
              {captureDate && (
                <input type="hidden" name="date" value={captureDate} />
              )}
              <button
                type="submit"
                disabled={isCapturing || !captureDate}
                title={
                  alreadyCaptured
                    ? `Update ${isYesterday ? "yesterday" : "today"}'s capture`
                    : `Capture ${isYesterday ? "yesterday" : "today"}'s data`
                }
                className={`flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-sm rounded-lg transition-colors ${
                  alreadyCaptured
                    ? "text-success-500 cursor-pointer hover:text-success-400 hover:bg-surface-elevated"
                    : isCapturing
                      ? "text-primary-500 cursor-wait opacity-75"
                      : "text-primary-500 cursor-pointer hover:text-primary-400 hover:bg-surface-elevated"
                }`}
              >
                <PushPin
                  size={18}
                  weight={alreadyCaptured ? "fill" : "regular"}
                />
                {isCapturing
                  ? "Capturing…"
                  : alreadyCaptured
                    ? "Captured"
                    : `Capture ${isYesterday ? "Yesterday" : "Today"}`}
              </button>
            </fetcher.Form>
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
