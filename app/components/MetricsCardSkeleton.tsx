/**
 * Skeleton placeholder for MetricsCard. Matches layout to prevent layout shift.
 */
export function MetricsCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) p-5 animate-pulse">
      <div className="h-6 w-20 bg-surface-elevated rounded mb-4" />
      <div className="pt-4 border-t border-(--color-border)">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(11rem,1fr))] gap-x-6 gap-y-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-2.5 min-w-0">
              <div className="size-5 rounded bg-(--color-border) shrink-0" />
              <div className="space-y-2 min-w-0">
                <div className="h-7 w-12 bg-surface-elevated rounded" />
                <div className="h-3 w-20 bg-(--color-border) rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
