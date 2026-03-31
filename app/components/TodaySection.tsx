import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Check, PushPin } from "phosphor-react";
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
  basecampConfigured?: boolean;
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
  basecampConfigured = false,
}: TodaySectionProps) {
  const stats = payload?.stats ?? null;
  const fetcher = useFetcher<{
    ok?: boolean;
    date?: string;
    error?: string;
    basecampPosted?: boolean;
    basecampError?: string;
  }>();
  const toast = useToast();
  const toastedRef = useRef(false);
  const [postToBasecamp, setPostToBasecamp] = useState(false);

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
      let msg = `${isYesterday ? "Yesterday" : "Today"}'s data ${verb}`;
      if (fetcher.data.basecampPosted) msg += " + posted to Basecamp";
      else if (fetcher.data.basecampError) msg += " (Basecamp post failed)";
      toast(msg);
    }
    if (fetcher.state === "submitting") {
      toastedRef.current = false;
    }
  }, [fetcher.data, fetcher.state, isYesterday, alreadyCaptured, toast]);

  return (
    <div className="xl:flex xl:flex-col xl:min-h-0">
      <div className="flex items-center justify-between shrink-0 pb-2">
        <h2 className="text-lg font-semibold text-(--color-text)">{title}</h2>
        <div className="flex items-center gap-2">
          {refreshIntervalLabel && refreshIntervalLabel !== "Off" && (
            <span className="text-xs text-text-muted">
              Refreshes every {refreshIntervalLabel}
            </span>
          )}
          {stats && (
            <fetcher.Form
              method="post"
              action="/api/snapshot"
              className="flex items-center gap-1"
            >
              <input
                type="hidden"
                name="mode"
                value={isYesterday ? "yesterday" : "today"}
              />
              {captureDate && (
                <input type="hidden" name="date" value={captureDate} />
              )}
              <input
                type="hidden"
                name="postToBasecamp"
                value={postToBasecamp ? "true" : "false"}
              />
              <fieldset
                className="min-w-0 border-0 p-0 m-0"
                aria-label={`Capture ${isYesterday ? "yesterday" : "today"}'s metrics${basecampConfigured ? "; optionally post check-in to Basecamp when capturing" : ""}`}
              >
                <div className="inline-flex items-stretch rounded-lg bg-surface-elevated/50">
                  <button
                    type="submit"
                    disabled={isCapturing || !captureDate}
                    title={
                      alreadyCaptured
                        ? `Update ${isYesterday ? "yesterday" : "today"}'s capture`
                        : `Capture ${isYesterday ? "yesterday" : "today"}'s data`
                    }
                    className={`capture-toolbar-btn flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-sm transition-colors ${
                      basecampConfigured ? "rounded-l-lg" : "rounded-lg"
                    } ${
                      alreadyCaptured
                        ? "text-success-500 cursor-pointer hover:text-success-400 hover:bg-surface-elevated/80"
                        : isCapturing
                          ? "text-primary-500 cursor-wait opacity-75"
                          : "text-primary-500 cursor-pointer hover:text-primary-400 hover:bg-surface-elevated/80"
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
                  {basecampConfigured && (
                    <>
                      <div
                        className="w-px shrink-0 bg-(--color-border) my-2"
                        aria-hidden
                      />
                      <button
                        type="button"
                        onClick={() => setPostToBasecamp((v) => !v)}
                        role="checkbox"
                        aria-checked={postToBasecamp}
                        title={
                          postToBasecamp
                            ? "With Basecamp on, capture also posts your check-in. Click to turn off."
                            : "Click to turn on. When Basecamp is on, capture also posts your check-in."
                        }
                        className={`capture-toolbar-btn flex items-center gap-2 min-h-[44px] pl-2.5 pr-3 py-2 text-sm transition-colors rounded-r-lg ${
                          postToBasecamp
                            ? "text-primary-400 bg-primary-500/10 hover:bg-primary-500/15"
                            : "text-text-muted hover:text-(--color-text) hover:bg-surface-elevated/80"
                        }`}
                      >
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                            postToBasecamp
                              ? "border-primary-500 bg-primary-500/25"
                              : "border-(--color-border) bg-surface-elevated/40"
                          }`}
                          aria-hidden
                        >
                          <Check
                            size={14}
                            weight="bold"
                            className={
                              postToBasecamp
                                ? "text-primary-400"
                                : "text-transparent"
                            }
                          />
                        </span>
                        <span className="whitespace-nowrap font-medium">
                          Basecamp
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </fieldset>
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
