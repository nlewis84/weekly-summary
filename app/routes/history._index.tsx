import { useState, useMemo, useEffect } from "react";
import { useLoaderData, Link, useRevalidator, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { listWeeklySummaries } from "../../lib/github-fetch";
import { buildMarkdownSummary } from "../../lib/markdown";
import {
  CalendarBlank,
  MagnifyingGlass,
  Package,
  CheckSquare,
  Square,
} from "phosphor-react";
import { ErrorBanner } from "../components/ErrorBanner";
import { useToast } from "../components/Toast";
import JSZip from "jszip";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const bust = !!url.searchParams.get("_bust");

  try {
    const weeks = await listWeeklySummaries({ bust });
    return data({ weeks, error: null as string | null });
  } catch (err) {
    console.error("History loader error:", err);
    return data({ weeks: [], error: (err as Error).message });
  }
}

function formatWeekLabel(weekEnding: string): string {
  const d = new Date(weekEnding);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function matchesSearch(week: string, label: string, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return week.toLowerCase().includes(q) || label.toLowerCase().includes(q);
}

export default function HistoryIndex() {
  const { weeks, error } = useLoaderData<typeof loader>() as {
    weeks: string[];
    error: string | null;
  };
  const revalidator = useRevalidator();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

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

  const filteredWeeks = useMemo(() => {
    if (!debouncedSearch.trim()) return weeks;
    return weeks.filter((week) =>
      matchesSearch(week, formatWeekLabel(week), debouncedSearch)
    );
  }, [weeks, debouncedSearch]);

  const toggleWeek = (week: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredWeeks.forEach((w) => next.add(w));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkExport = async (weeksToExport: string[]) => {
    if (weeksToExport.length === 0) {
      toast("Select at least one week to export");
      return;
    }
    setExporting(true);
    try {
      const zip = new JSZip();
      let exported = 0;
      for (const week of weeksToExport) {
        const res = await fetch(`/api/history/${week}`);
        if (!res.ok) continue;
        const { payload } = (await res.json()) as {
          payload?: import("../../lib/types").Payload;
        };
        if (!payload) continue;
        const md = buildMarkdownSummary(payload);
        zip.file(`${week}.md`, md);
        exported++;
      }
      if (exported === 0) {
        toast("No weeks could be exported (JSON summaries only)");
        setExporting(false);
        return;
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const sorted = [...weeksToExport].sort();
      a.download = `weekly-summaries-${sorted[0]}-to-${sorted[sorted.length - 1]}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported ${exported} week${exported === 1 ? "" : "s"}`);
      clearSelection();
    } catch (e) {
      toast("Export failed");
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-(--color-text)">
            Historical Summaries
          </h2>
          <Link
            to="/history/compare"
            prefetch="intent"
            className="text-sm text-primary-500 hover:text-primary-400 font-medium"
          >
            Compare weeks
          </Link>
          <Link
            to="/charts?view=annual"
            prefetch="intent"
            className="text-sm text-primary-500 hover:text-primary-400 font-medium"
          >
            Annual
          </Link>
          {filteredWeeks.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleBulkExport(
                    selected.size > 0 ? [...selected] : filteredWeeks
                  )
                }
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-500 hover:bg-(--color-surface-elevated) rounded-lg transition-colors disabled:opacity-50"
                title={
                  selected.size > 0
                    ? `Export ${selected.size} selected`
                    : "Export all visible"
                }
              >
                <Package size={16} weight="regular" />
                {exporting
                  ? "Exporting…"
                  : selected.size > 0
                    ? `Export ${selected.size}`
                    : "Export all"}
              </button>
              {selected.size > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-sm text-(--color-text-muted) hover:text-primary-500"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <MagnifyingGlass
            size={18}
            weight="regular"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-(--color-text-muted) pointer-events-none"
          />
          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by date or week…"
            aria-label="Search history"
            className="w-full sm:w-64 pl-8 pr-4 py-2 text-sm bg-(--color-surface-elevated) border border-(--color-border) rounded-lg text-(--color-text) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
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

      {weeks.length === 0 && !error ? (
        <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) p-8 text-center text-(--color-text-muted) border border-(--color-border)">
          No summaries found in repository.
        </div>
      ) : filteredWeeks.length === 0 ? (
        <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) p-8 text-center text-(--color-text-muted) border border-(--color-border)">
          No weeks match &quot;{search}&quot;.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-(--color-text-muted)">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="hover:text-primary-500"
            >
              Select all
            </button>
            <span>·</span>
            <span>{filteredWeeks.length} weeks</span>
          </div>
          <ul className="space-y-2">
            {filteredWeeks.map((week: string) => (
              <li key={week}>
                <div className="flex items-center gap-3 p-4 bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) hover:shadow-(--shadow-skeuo-card-hover) hover:border-primary-500/50 transition-all group">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWeek(week);
                    }}
                    className="shrink-0 p-0.5 text-(--color-text-muted) hover:text-primary-500"
                    aria-label={selected.has(week) ? "Deselect" : "Select"}
                  >
                    {selected.has(week) ? (
                      <CheckSquare
                        size={20}
                        weight="fill"
                        className="text-primary-500"
                      />
                    ) : (
                      <Square size={20} weight="regular" />
                    )}
                  </button>
                  <Link
                    to={`/history/${week}`}
                    prefetch="intent"
                    className="flex flex-1 items-center gap-3 min-w-0"
                  >
                    <CalendarBlank
                      size={22}
                      weight="regular"
                      className="text-primary-500 shrink-0"
                    />
                    <span className="font-medium text-(--color-text) group-hover:text-primary-500 transition-colors">
                      Week ending {formatWeekLabel(week)}
                    </span>
                    <span className="text-sm text-(--color-text-muted) ml-auto shrink-0">
                      {week}
                    </span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
