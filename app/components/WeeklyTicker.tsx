import { CalendarBlank } from "phosphor-react";
import type { Stats } from "../../lib/types";

interface WeeklyTickerProps {
  stats: Stats;
}

export function WeeklyTicker({ stats }: WeeklyTickerProps) {
  const items = [
    { label: "PRs merged", value: stats.prs_merged },
    { label: "PR reviews", value: stats.pr_reviews },
    { label: "Linear completed", value: stats.linear_completed },
    { label: "Linear worked on", value: stats.linear_worked_on },
    { label: "Repos", value: stats.repos.length },
  ];

  return (
    <div className="bg-gray-50 rounded-xl shadow-[var(--shadow-skeuo-card)] border border-gray-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="flex items-center gap-2 font-medium text-gray-700">
          <CalendarBlank size={18} weight="regular" className="text-primary-500 shrink-0" />
          This week:
        </span>
        {items.map(({ label, value }) => (
          <span key={label} className="text-gray-600">
            {label} <span className="font-semibold text-primary-500">{value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
