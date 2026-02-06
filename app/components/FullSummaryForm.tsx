import { useEffect, useRef, useState } from "react";
import { FileText } from "phosphor-react";
import { useToast } from "./Toast";
import { LottieIcon } from "./LottieIcon";
import { MetricsCard } from "./MetricsCard";
import { ErrorBanner } from "./ErrorBanner";
import type { Payload } from "../../lib/types";

const LAST_BUILT_KEY = "weekly-summary-last-built";

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

  const [lastBuilt, setLastBuilt] = useState<{
    builtAt: string;
    weekEnding: string;
  } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LAST_BUILT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { builtAt: string; weekEnding: string };
      if (parsed?.builtAt && parsed?.weekEnding) setLastBuilt(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (saved && builtAt && weekEnding && !savedRef.current) {
      savedRef.current = true;
      toast("Summary saved to repository");
      const entry = { builtAt, weekEnding };
      setLastBuilt(entry);
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
    const openIfHash = () => {
      if (window.location.hash === "#build-summary" && detailsRef.current) {
        detailsRef.current.open = true;
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
      className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)]"
    >
      <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer font-medium text-[var(--color-text)] list-none [&::-webkit-details-marker]:hidden">
        <FileText
          size={20}
          weight="regular"
          className="text-primary-500 shrink-0"
        />
        Build Weekly Summary
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-[var(--color-border)] space-y-4">
        {lastBuilt && (
          <p className="text-sm text-[var(--color-text-muted)]">
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
              className="block text-sm font-medium text-[var(--color-text-muted)] mb-2"
            >
              Check-ins
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {[
                { label: "PR reviews", text: "PR reviews" },
                { label: "Feature work", text: "Feature work" },
                { label: "Bug fixes", text: "Bug fixes" },
                { label: "Meetings", text: "Meetings" },
                { label: "Documentation", text: "Documentation" },
              ].map(({ label, text }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const ta = document.getElementById(
                      "checkIns"
                    ) as HTMLTextAreaElement | null;
                    if (ta) {
                      const insert = ta.value ? `\n${text}` : text;
                      ta.value += insert;
                      ta.focus();
                      ta.setSelectionRange(ta.value.length, ta.value.length);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-medium text-primary-600 hover:text-primary-500 hover:bg-primary-500/10 rounded-lg border border-primary-500/30 transition-colors"
                >
                  + {label}
                </button>
              ))}
            </div>
            <textarea
              id="checkIns"
              name="checkIns"
              rows={6}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface-elevated)] shadow-[var(--shadow-skeuo-inset)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-[var(--color-text)]"
              placeholder="Monday: PR reviews&#10;Tuesday: Worked on feature X..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="todayOnly"
              name="todayOnly"
              className="rounded border-[var(--color-border)] text-primary-600 focus:ring-primary-500"
            />
            <label
              htmlFor="todayOnly"
              className="text-sm text-[var(--color-text-muted)]"
            >
              Today only
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] px-4 py-2.5 bg-primary-600 hover:bg-primary-500 hover:-translate-y-0.5 hover:shadow-[var(--shadow-skeuo-button-hover)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-medium rounded-xl shadow-[var(--shadow-skeuo-button)] transition-all duration-300 active:translate-y-0 active:shadow-[var(--shadow-skeuo-button)]"
          >
            {isSubmitting ? "Generating…" : "Generate & Save"}
          </button>
        </Form>

        {error && <ErrorBanner message={error} />}

        {saved && (
          <div className="space-y-4">
            <div className="p-4 bg-[var(--color-success-bg)] border border-[var(--color-success-border)] rounded-xl flex items-center gap-4">
              <LottieIcon name="check" size={48} loop={false} />
              <div className="flex-1">
                <p className="font-medium text-[var(--color-success-500)]">
                  Saved to repository.
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">
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
