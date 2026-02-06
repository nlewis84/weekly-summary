/**
 * Skeleton placeholder for WeeklyTicker. Matches layout to prevent layout shift.
 */
export function WeeklyTickerSkeleton() {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl shadow-[var(--shadow-skeuo-card)] border border-[var(--color-border)] p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-24 bg-[var(--color-surface-elevated)] rounded" />
        <div className="h-9 w-16 bg-[var(--color-surface-elevated)] rounded-lg" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3 bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border)]">
            <div className="h-3 w-16 mb-2 bg-[var(--color-surface)] rounded" />
            <div className="h-5 w-8 bg-[var(--color-surface)] rounded" />
          </div>
        ))}
      </div>
      <div className="mt-3 p-3 bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border)]">
        <div className="h-4 w-32 bg-[var(--color-surface)] rounded" />
      </div>
    </div>
  );
}
