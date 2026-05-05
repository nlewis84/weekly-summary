import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import { Check, PushPin } from "phosphor-react";
import { BasecampCheckInPreviewDialog } from "./BasecampCheckInPreviewDialog";
import { MetricsCard } from "./MetricsCard";
import { MetricsCardSkeleton } from "./MetricsCardSkeleton";
import { RefreshButton } from "./RefreshButton";
import { ErrorBanner } from "./ErrorBanner";
import { useToast } from "./Toast";
import type { Payload } from "../../lib/types";
import type { WeeklyGoals } from "../hooks/useGoals";

type SnapshotFetcherData =
  | {
      ok: true;
      preview: true;
      draft: string;
      date: string;
      granolaWarning?: string;
    }
  | {
      ok: true;
      date?: string;
      basecampPosted?: boolean;
      basecampError?: string;
    }
  | { error: string };

function isSnapshotPreview(
  d: SnapshotFetcherData | undefined
): d is Extract<SnapshotFetcherData, { preview: true }> {
  return (
    !!d &&
    "ok" in d &&
    d.ok === true &&
    "preview" in d &&
    d.preview === true
  );
}

function isSnapshotCommit(
  d: SnapshotFetcherData | undefined
): d is {
  ok: true;
  date?: string;
  basecampPosted?: boolean;
  basecampError?: string;
} {
  return !!d && "ok" in d && d.ok === true && !isSnapshotPreview(d);
}

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
  granolaConfigured?: boolean;
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
  granolaConfigured = false,
}: TodaySectionProps) {
  const stats = payload?.stats ?? null;
  const fetcher = useFetcher<SnapshotFetcherData>();
  const toast = useToast();
  const toastedRef = useRef(false);
  const [postToBasecamp, setPostToBasecamp] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [modalDraft, setModalDraft] = useState("");
  const [modalGranolaWarning, setModalGranolaWarning] = useState("");

  const isYesterday = title === "Yesterday";
  const captureDate = payload?.meta.window_start?.slice(0, 10) ?? "";
  const sessionCommittedThisDate =
    isSnapshotCommit(fetcher.data) && fetcher.data.date === captureDate;
  const alreadyCaptured =
    capturedDates.includes(captureDate) || sessionCommittedThisDate;
  const isWorking = fetcher.state !== "idle";

  const useBasecampPreviewFlow = basecampConfigured && postToBasecamp;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if (isSnapshotPreview(fetcher.data)) {
      setModalDraft(fetcher.data.draft);
      setModalGranolaWarning(fetcher.data.granolaWarning ?? "");
      setPreviewOpen(true);
    }
  }, [fetcher.data, fetcher.state]);

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) return;
    if ("error" in fetcher.data && fetcher.data.error) {
      toast(fetcher.data.error);
    }
  }, [fetcher.data, fetcher.state, toast]);

  useEffect(() => {
    if (fetcher.state === "submitting") {
      toastedRef.current = false;
      return;
    }
    const d = fetcher.data;
    if (!d || isSnapshotPreview(d)) return;
    if ("ok" in d && d.ok) {
      setPreviewOpen(false);
      if (!toastedRef.current) {
        toastedRef.current = true;
        const verb = capturedDates.includes(captureDate)
          ? "updated"
          : "captured";
        let msg = `${isYesterday ? "Yesterday" : "Today"}'s data ${verb}`;
        if (d.basecampPosted) msg += " + posted to Basecamp";
        else if (d.basecampError) msg += " (Basecamp post failed)";
        toast(msg);
      }
    }
  }, [fetcher.data, fetcher.state, isYesterday, capturedDates, captureDate, toast]);

  const submitSnapshot = (body: Record<string, string>) => {
    fetcher.submit(body, { method: "post", action: "/api/snapshot" });
  };

  const handleCapture = () => {
    if (!captureDate) return;
    if (useBasecampPreviewFlow) {
      submitSnapshot({
        mode: isYesterday ? "yesterday" : "today",
        date: captureDate,
        previewBasecamp: "true",
      });
    } else {
      submitSnapshot({
        mode: isYesterday ? "yesterday" : "today",
        date: captureDate,
        postToBasecamp: postToBasecamp ? "true" : "false",
      });
    }
  };

  const handleModalPost = () => {
    if (!captureDate) return;
    submitSnapshot({
      mode: isYesterday ? "yesterday" : "today",
      date: captureDate,
      postToBasecamp: "true",
      checkInBody: modalDraft,
    });
  };

  const handleModalSaveOnly = () => {
    if (!captureDate) return;
    submitSnapshot({
      mode: isYesterday ? "yesterday" : "today",
      date: captureDate,
      postToBasecamp: "false",
    });
  };

  const captureLabel = isWorking
    ? useBasecampPreviewFlow
      ? "Preparing…"
      : "Capturing…"
    : alreadyCaptured
      ? "Captured"
      : `Capture ${isYesterday ? "Yesterday" : "Today"}`;

  return (
    <div className="xl:flex xl:flex-col xl:min-h-0">
      <BasecampCheckInPreviewDialog
        open={previewOpen}
        draft={modalDraft}
        onDraftChange={setModalDraft}
        granolaWarning={modalGranolaWarning}
        granolaConfigured={granolaConfigured}
        isBusy={isWorking}
        onCancel={() => setPreviewOpen(false)}
        onPost={handleModalPost}
        onSaveOnly={handleModalSaveOnly}
      />

      <div className="flex items-center justify-between shrink-0 pb-2">
        <h2 className="text-lg font-semibold text-(--color-text)">{title}</h2>
        <div className="flex items-center gap-2">
          {refreshIntervalLabel && refreshIntervalLabel !== "Off" && (
            <span className="text-xs text-text-muted">
              Refreshes every {refreshIntervalLabel}
            </span>
          )}
          {stats && (
            <div className="flex items-center gap-1">
              <fieldset
                className="min-w-0 border-0 p-0 m-0"
                aria-label={`Capture ${isYesterday ? "yesterday" : "today"}'s metrics${basecampConfigured ? "; with Basecamp enabled, capture opens a preview before posting" : ""}`}
              >
                <div className="inline-flex items-stretch rounded-lg bg-surface-elevated/50">
                  <button
                    type="button"
                    onClick={handleCapture}
                    disabled={isWorking || !captureDate}
                    title={
                      alreadyCaptured
                        ? `Update ${isYesterday ? "yesterday" : "today"}'s capture`
                        : useBasecampPreviewFlow
                          ? `Prepare ${isYesterday ? "yesterday" : "today"}'s check-in preview for Basecamp`
                          : `Capture ${isYesterday ? "yesterday" : "today"}'s data`
                    }
                    className={`capture-toolbar-btn flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-sm transition-colors ${
                      basecampConfigured ? "rounded-l-lg" : "rounded-lg"
                    } ${
                      alreadyCaptured
                        ? "text-success-500 cursor-pointer hover:text-success-400 hover:bg-surface-elevated/80"
                        : isWorking
                          ? "text-primary-500 cursor-wait opacity-75"
                          : "text-primary-500 cursor-pointer hover:text-primary-400 hover:bg-surface-elevated/80"
                    }`}
                  >
                    <PushPin
                      size={18}
                      weight={alreadyCaptured ? "fill" : "regular"}
                    />
                    {captureLabel}
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
                            ? "Basecamp on: capture opens a preview before posting. Click to turn off."
                            : "Click to turn on Basecamp. When on, capture opens a preview before posting your check-in."
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
            </div>
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
