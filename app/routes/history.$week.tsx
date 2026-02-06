import { useEffect } from "react";
import { useLoaderData, Link, useRevalidator, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import {
  fetchWeeklySummaryRaw,
  fetchWeeklySummary,
} from "../../lib/github-fetch";
import { buildMarkdownSummary } from "../../lib/markdown";
import { MetricsCard } from "~/components/MetricsCard";
import { ErrorBanner } from "~/components/ErrorBanner";
import { useToast } from "~/components/Toast";
import { ArrowLeft, Copy, FilePdf } from "phosphor-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const bust = !!url.searchParams.get("_bust");

  const week = params.week;
  if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    return data({
      error: "Invalid week format",
      payload: null,
      prevPayload: null,
      markdown: null,
    });
  }

  try {
    const result = await fetchWeeklySummaryRaw(week, { bust });
    const payload =
      result && !("type" in result && result.type === "markdown")
        ? (result as import("../../lib/types").Payload)
        : null;
    const markdown =
      result && "type" in result && result.type === "markdown"
        ? result.content
        : null;
    let prevPayload = null;
    try {
      const d = new Date(week + "T12:00:00Z");
      d.setDate(d.getDate() - 7);
      const prevWeek = d.toISOString().slice(0, 10);
      prevPayload = await fetchWeeklySummary(prevWeek, { bust });
    } catch {
      // No previous week
    }
    return data({
      payload,
      prevPayload,
      markdown,
      week,
      error: null as string | null,
    });
  } catch (err) {
    console.error("History week loader error:", err);
    return data({
      error: (err as Error).message,
      payload: null,
      prevPayload: null,
      markdown: null,
      week,
    });
  }
}

function formatWeekLabel(weekEnding: string): string {
  const d = new Date(weekEnding);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryWeek() {
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const { payload, prevPayload, markdown, error, week } = useLoaderData<
    typeof loader
  >() as {
    payload: import("../../lib/types").Payload | null;
    prevPayload?: import("../../lib/types").Payload | null;
    markdown: string | null;
    error: string | null;
    week: string;
  };
  const toast = useToast();

  // Strip _bust from URL after load to keep URL clean
  useEffect(() => {
    if (searchParams.get("_bust") && revalidator.state !== "loading") {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("_bust");
        return next.size ? next : new URLSearchParams();
      });
    }
  }, [searchParams, revalidator.state, setSearchParams]);

  const handleCopyMarkdown = async () => {
    const text = payload ? buildMarkdownSummary(payload) : markdown;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast("Markdown copied to clipboard");
  };

  const handleExportPdf = () => {
    const text = payload ? buildMarkdownSummary(payload) : markdown;
    if (!text) return;
    const win = window.open("", "_blank");
    if (!win) {
      toast("Popup blocked—allow popups to export PDF");
      return;
    }
    const label = week ? formatWeekLabel(week) : "Summary";
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Weekly Summary — ${label}</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 65ch; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #1a1a1a; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            h2 { font-size: 1.1rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
            pre { white-space: pre-wrap; font-size: 0.875rem; background: #f5f5f5; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
            ul { margin: 0.5rem 0; padding-left: 1.5rem; }
            @media print { body { margin: 1rem; } }
          </style>
        </head>
        <body>
          <pre>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 250);
  };

  return (
    <div className="space-y-6">
      <Link
        to="/history"
        prefetch="intent"
        className="inline-flex items-center gap-2 text-sm text-(--color-text-muted) hover:text-primary-500 transition-colors"
      >
        <ArrowLeft size={18} weight="regular" />
        Back to History
      </Link>

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-(--color-text)">
          Week ending {week ? formatWeekLabel(week) : "—"}
        </h2>
        {(payload || markdown) && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportPdf}
              className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-sm text-(--color-text-muted) hover:text-primary-500 hover:bg-(--color-surface-elevated) rounded-lg transition-colors"
              title="Export as PDF (opens print dialog)"
            >
              <FilePdf size={16} weight="regular" />
              Export PDF
            </button>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 text-sm text-(--color-text-muted) hover:text-primary-500 hover:bg-(--color-surface-elevated) rounded-lg transition-colors"
              title="Copy full markdown"
            >
              <Copy size={16} weight="regular" />
              Copy markdown
            </button>
          </div>
        )}
      </div>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={() => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set("_bust", Date.now().toString());
              return next;
            });
          }}
        />
      )}

      {payload ? (
        <MetricsCard
          stats={payload.stats}
          prevStats={prevPayload?.stats ?? null}
          payload={payload}
        />
      ) : markdown ? (
        <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) p-6">
          <p className="text-sm text-(--color-text-muted) mb-4">
            Week-in-review (transcript)
          </p>
          <pre className="whitespace-pre-wrap text-sm text-(--color-text) font-sans max-h-[60vh] overflow-y-auto">
            {markdown}
          </pre>
        </div>
      ) : !error ? (
        <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) p-8 text-center text-(--color-text-muted) border border-(--color-border)">
          Summary not found.
        </div>
      ) : null}
    </div>
  );
}
