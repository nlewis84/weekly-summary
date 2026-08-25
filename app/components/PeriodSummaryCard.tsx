/**
 * One card in the right rail for both reporting periods, switched by a segmented
 * control in its header. Week and month want the same slot and are never read at
 * the same time, so they share it rather than each claiming their own.
 *
 * The header's right side is period-specific: Copy belongs to the week's stat
 * list, and the pace pill describes the month — showing it over the week's
 * numbers would read as a verdict on the week.
 */

import { useState } from "react";
import { CalendarBlank, Copy, Target } from "phosphor-react";
import { WeeklyTickerBody, formatStatsForCopy } from "./WeeklyTicker";
import { WeeklyTickerSkeleton } from "./WeeklyTickerSkeleton";
import { MonthlyProgressBody, monthlyStatus } from "./MonthlyProgressBody";
import { ErrorBanner } from "./ErrorBanner";
import { useToast } from "./Toast";
import type { Stats } from "../../lib/types";
import type { WeeklyGoals } from "../hooks/useGoals";
import type { MonthlyProgress } from "../../lib/monthly-pace";

type Period = "week" | "month";

const PERIODS: { key: Period; label: string }[] = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
];

interface PeriodSummaryCardProps {
  weekStats: Stats | null;
  weekPrevStats?: Stats | null;
  weekError: string | null;
  goals?: WeeklyGoals;
  monthly: MonthlyProgress | null;
  monthlyError: string | null;
  monthlyTarget: number;
  isLoading?: boolean;
}

export function PeriodSummaryCard({
  weekStats,
  weekPrevStats,
  weekError,
  goals,
  monthly,
  monthlyError,
  monthlyTarget,
  isLoading,
}: PeriodSummaryCardProps) {
  const [period, setPeriod] = useState<Period>("week");
  const toast = useToast();

  const showingMonth = period === "month";
  const error = showingMonth ? monthlyError : weekError;
  const hasBody = showingMonth ? monthly != null : weekStats != null;

  const handleCopy = async () => {
    if (!weekStats) return;
    await navigator.clipboard.writeText(formatStatsForCopy(weekStats));
    toast("Stats copied to clipboard");
  };

  // Only meaningful while the month is showing; the header pill is hidden
  // otherwise, so this is computed but unused on the week tab.
  const monthStatus =
    monthly != null ? monthlyStatus(monthly, monthlyTarget).status : null;

  return (
    <div
      className={`bg-surface rounded-xl shadow-(--shadow-skeuo-card) hover:shadow-(--shadow-skeuo-card-hover) border border-(--color-border) p-5 transition-all duration-300 xl:flex xl:flex-col xl:min-h-0 ${
        isLoading ? "opacity-90" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 pb-4">
        <div
          role="tablist"
          aria-label="Summary period"
          className="flex rounded-lg border border-(--color-border) p-0.5 bg-surface-elevated"
        >
          {PERIODS.map(({ key, label }) => {
            const selected = period === key;
            const Icon = key === "week" ? CalendarBlank : Target;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setPeriod(key)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  selected
                    ? "bg-primary-600 text-white shadow-sm hover:bg-primary-500"
                    : "text-text-muted hover:text-(--color-text)"
                }`}
              >
                <Icon size={15} weight="regular" className="shrink-0" />
                {label}
              </button>
            );
          })}
        </div>

        {showingMonth
          ? monthStatus && (
              <span
                className={`flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full border text-xs font-medium ${monthStatus.pill}`}
              >
                <monthStatus.Icon size={13} weight="bold" />
                {monthStatus.label}
              </span>
            )
          : weekStats && (
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy stats for standup"
                className="flex items-center justify-center gap-1.5 min-h-[36px] px-2.5 py-1.5 text-sm text-text-muted hover:text-primary-500 hover:bg-surface-elevated rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                title="Copy stats for standup"
              >
                <Copy size={16} weight="regular" />
                Copy
              </button>
            )}
      </div>

      <div className="pt-4 border-t border-(--color-border) xl:flex-1 xl:min-h-0 xl:flex xl:flex-col">
        {error && (
          <ErrorBanner
            message={`${showingMonth ? "Monthly progress" : "Weekly"}: ${error}`}
          />
        )}
        {hasBody ? (
          showingMonth ? (
            <MonthlyProgressBody progress={monthly!} target={monthlyTarget} />
          ) : (
            <WeeklyTickerBody
              stats={weekStats!}
              prevStats={weekPrevStats ?? null}
              goals={goals}
            />
          )
        ) : !error && isLoading ? (
          <WeeklyTickerSkeleton />
        ) : null}
      </div>
    </div>
  );
}
