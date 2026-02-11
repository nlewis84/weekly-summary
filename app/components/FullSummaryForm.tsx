import { useEffect, useRef, useState } from "react";
import { FileText } from "phosphor-react";
import { useToast } from "./Toast";
import { LottieIcon } from "./LottieIcon";
import { MetricsCard } from "./MetricsCard";
import { ErrorBanner } from "./ErrorBanner";
import type { Payload } from "../../lib/types";

const LAST_BUILT_KEY = "weekly-summary-last-built";

function readLastBuiltFromStorage(): {
  builtAt: string;
  weekEnding: string;
} | null {
  try {
    const raw = localStorage.getItem(LAST_BUILT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { builtAt?: string; weekEnding?: string };
    return parsed?.builtAt && parsed?.weekEnding
      ? { builtAt: parsed.builtAt, weekEnding: parsed.weekEnding }
      : null;
  } catch {
    return null;
  }
}

interface FullSummaryFormProps {
  Form: React.ComponentType<Record<string, unknown>>;
  action: string;
  isSubmitting: boolean;
  error?: string;
  saved?: boolean;
  builtAt?: string;
  weekEnding?: string;
  payload?: Payload | null;
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const s = Math.round((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  if (s < 604800) return `${Math.floor(s / 86400)} days ago`;
  return d.toLocaleDateString();
}

export function FullSummaryForm({
  Form,
  action,
  isSubmitting,
  error,
  saved,
  builtAt,
  weekEnding,
  payload,
}: FullSummaryFormProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const toast = useToast();
  const savedRef = useRef(false);
  const [isXlScreen, setIsXlScreen] = useState(false);

  const [lastBuilt, setLastBuilt] = useState<{
    builtAt: string;
    weekEnding: string;
  } | null>(readLastBuiltFromStorage);

  const [isFormExpanded, setIsFormExpanded] = useState(
    () => !readLastBuiltFromStorage()
  );

  useEffect(() => {
    const stored = readLastBuiltFromStorage();
    if (stored) setLastBuilt(stored);
  }, []);

  useEffect(() => {
    if (saved && builtAt && weekEnding && !savedRef.current) {
      savedRef.current = true;
      toast("Summary saved to repository");
      const entry = { builtAt, weekEnding };
      setLastBuilt(entry);
      setIsFormExpanded(false);
      try {
        localStorage.setItem(LAST_BUILT_KEY, JSON.stringify(entry));
      } catch {
        /* ignore */
      }
    }
    if (!saved) savedRef.current = false;
  }, [saved, builtAt, weekEnding, toast]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkScreenSize = () => {
      setIsXlScreen(window.matchMedia("(min-width: 1280px)").matches);
    };
    checkScreenSize();
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    mediaQuery.addEventListener("change", checkScreenSize);
    return () => mediaQuery.removeEventListener("change", checkScreenSize);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const openIfHash = () => {
      if (window.location.hash === "#build-summary") {
        setIsFormExpanded(true);
        document
          .getElementById("build-summary")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    };
    openIfHash();
    window.addEventListener("hashchange", openIfHash);
    return () => window.removeEventListener("hashchange", openIfHash);
  }, []);

  return (
    <details
      ref={detailsRef}
      open={isFormExpanded}
      onToggle={(e) => {
        const el = e.target as HTMLDetailsElement;
        if (el.open !== isFormExpanded) setIsFormExpanded(el.open);
      }}
      className="w-full xl:w-96 bg-surface rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) xl:flex-1 xl:min-h-0 xl:flex xl:flex-col"
    >
      <summary className="flex flex-col gap-1 px-5 py-4 cursor-pointer font-medium text-(--color-text) list-none [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <FileText
            size={20}
            weight="regular"
            className="text-primary-500 shrink-0"
          />
          Build Weekly Summary
        </div>
        {lastBuilt && !isFormExpanded && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-normal text-text-muted mt-0.5">
            <span>
              Last built: {formatRelativeTime(lastBuilt.builtAt)}
              {lastBuilt.weekEnding && (
                <span className="ml-1">
                  (week ending{" "}
                  {new Date(lastBuilt.weekEnding).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  )
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsFormExpanded(true);
              }}
              className="text-primary-600 hover:text-primary-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
            >
              Edit check-ins & generate again
            </button>
          </div>
        )}
      </summary>
      <div className="px-5 pb-5 pt-4 border-t border-(--color-border) space-y-4 xl:flex-1 xl:min-h-0">
        {lastBuilt && isFormExpanded && (
          <p className="text-sm text-text-muted">
            Last built: {formatRelativeTime(lastBuilt.builtAt)}
            {lastBuilt.weekEnding && (
              <span className="ml-1">
                (week ending{" "}
                {new Date(lastBuilt.weekEnding).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                )
              </span>
            )}
          </p>
        )}
        <Form method="post" action={action} className="space-y-4">
          <input type="hidden" name="save" value="true" />
          <div>
            <label
              htmlFor="checkIns"
              className="block text-sm font-medium text-text-muted mb-2"
            >
              Check-ins
            </label>
            <textarea
              id="checkIns"
              name="checkIns"
              rows={isXlScreen ? 5 : 6}
              className="w-full min-h-0 max-h-48 overflow-y-auto resize-y px-3 py-2 border border-(--color-border) rounded-lg text-sm bg-surface-elevated shadow-(--shadow-skeuo-inset) focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-(--color-text)"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="todayOnly"
              name="todayOnly"
              className="rounded border-(--color-border) text-primary-600 focus:ring-primary-500"
            />
            <label
              htmlFor="todayOnly"
              className="text-sm text-text-muted"
            >
              Today only
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] px-4 py-2.5 bg-primary-600 hover:bg-primary-500 hover:-translate-y-0.5 hover:shadow-(--shadow-skeuo-button-hover) disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-medium rounded-xl shadow-(--shadow-skeuo-button) transition-all duration-300 active:translate-y-0 active:shadow-(--shadow-skeuo-button)"
          >
            {isSubmitting ? "Generating…" : "Generate & Save"}
          </button>
        </Form>

        {error && <ErrorBanner message={error} />}

        {saved && (
          <div className="space-y-4">
            <div className="p-4 bg-success-bg border border-success-border rounded-xl flex items-center gap-4">
              <LottieIcon name="check" size={48} loop={false} />
              <div className="flex-1">
                <p className="font-medium text-success-500">
                  Saved to repository.
                </p>
                <p className="text-sm text-text-muted mt-0.5">
                  Your weekly summary has been generated and committed.
                </p>
              </div>
            </div>
          </div>
        )}

        {payload?.stats && (
          <MetricsCard stats={payload.stats} payload={payload} />
        )}
      </div>
    </details>
  );
}
