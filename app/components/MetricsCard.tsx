import type { Stats } from "../../lib/types";

interface MetricsCardProps {
  stats: Stats;
}

const METRICS = [
  { key: "prs_merged" as const, label: "PRs merged", icon: "📦" },
  { key: "prs_total" as const, label: "PRs created/updated", icon: "📝" },
  { key: "pr_reviews" as const, label: "PR reviews", icon: "👀" },
  { key: "linear_completed" as const, label: "Linear issues completed", icon: "✅" },
  { key: "linear_worked_on" as const, label: "Linear issues worked on", icon: "🔄" },
] as const;

export function MetricsCard({ stats }: MetricsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-[var(--shadow-skeuo-card)] hover:shadow-[var(--shadow-skeuo-card-hover)] border border-gray-200/90 p-6 transition-all duration-300">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Metrics</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {METRICS.map(({ key, label, icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200/60 shadow-[var(--shadow-skeuo-inset)]"
          >
            <span className="text-sm text-gray-600">{icon} {label}</span>
            <span className="text-lg font-semibold text-primary-600">
              {stats[key]}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <span className="text-sm text-gray-600">Repos worked on</span>
        <p className="text-sm font-medium text-gray-900 mt-1">
          {stats.repos.length > 0 ? stats.repos.join(", ") : "—"}
        </p>
      </div>
    </div>
  );
}
