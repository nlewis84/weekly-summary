/**
 * Skeleton placeholder for WeeklyTicker. Matches layout to prevent layout shift.
 */
export function WeeklyTickerSkeleton() {
  return (
    <div className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) p-5 animate-pulse xl:h-full xl:flex xl:flex-col xl:min-h-0">
      <div className="flex items-center justify-between pb-4">
        <div className="h-5 w-24 bg-surface-elevated rounded" />
        <div className="h-9 w-16 bg-surface-elevated rounded-lg" />
      </div>
      <div className="pt-4 border-t border-(--color-border) space-y-1">
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
