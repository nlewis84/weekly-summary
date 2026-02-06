/**
 * Skeleton placeholder for MetricsCard. Matches layout to prevent layout shift.
 */
export function MetricsCardSkeleton() {
  return (
    <div className="bg-(--color-surface) rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-16 bg-(--color-surface-elevated) rounded" />
        <div className="h-8 w-12 bg-(--color-surface-elevated) rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-(--color-surface-elevated) rounded-lg border border-(--color-border)"
          >
            <div className="h-4 w-24 bg-(--color-border) rounded" />
            <div className="h-6 w-8 bg-(--color-border) rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
