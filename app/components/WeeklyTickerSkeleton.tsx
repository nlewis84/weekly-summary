/**
 * Body-only skeleton for the period card. The card chrome and header are always
 * rendered by PeriodSummaryCard, so this stands in for the stat rows alone.
 */
export function WeeklyTickerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-1">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-2.5 px-3 rounded-lg ${
              i % 2 === 1 ? "bg-surface-elevated/60" : ""
            }`}
          >
            <div className="h-4 w-24 bg-surface-elevated rounded" />
            <div className="h-5 w-8 bg-surface-elevated rounded" />
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3">
        <div className="h-3 w-32 bg-surface-elevated rounded" />
      </div>
    </div>
  );
}
