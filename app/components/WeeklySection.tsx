import { WeeklyTicker } from "./WeeklyTicker";
import { ErrorBanner } from "./ErrorBanner";
import type { Stats } from "../../lib/types";

interface WeeklySectionProps {
  stats: Stats | null;
  error: string | null;
}

export function WeeklySection({ stats, error }: WeeklySectionProps) {
  if (!stats && !error) return null;

  return (
    <>
      {error && <ErrorBanner message={`Weekly: ${error}`} />}
      {stats && (
        <div className="mt-4">
          <WeeklyTicker stats={stats} />
        </div>
      )}
    </>
  );
}
