import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { listWeeklySummaries } from "../../lib/github-fetch";
import { CalendarBlank } from "phosphor-react";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const weeks = await listWeeklySummaries();
    return data({ weeks, error: null as string | null });
  } catch (err) {
    console.error("History loader error:", err);
    return data({ weeks: [], error: (err as Error).message });
  }
}

function formatWeekLabel(weekEnding: string): string {
  const d = new Date(weekEnding);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function HistoryIndex() {
  const { weeks, error } = useLoaderData<typeof loader>() as { weeks: string[]; error: string | null };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Historical Summaries</h2>

      {error && (
        <div className="p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {weeks.length === 0 && !error ? (
        <div className="bg-gray-50 rounded-xl shadow-[var(--shadow-skeuo-card)] p-8 text-center text-gray-500 border border-gray-200">
          No summaries found in repository.
        </div>
      ) : (
        <ul className="space-y-2">
          {weeks.map((week: string) => (
            <li key={week}>
              <Link
                to={`/history/${week}`}
                className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl shadow-[var(--shadow-skeuo-card)] border border-gray-200 hover:shadow-[var(--shadow-skeuo-card-hover)] hover:border-primary-500/50 transition-all group"
              >
                <CalendarBlank size={22} weight="regular" className="text-primary-500 shrink-0" />
                <span className="font-medium text-gray-900 group-hover:text-primary-500 transition-colors">
                  Week ending {formatWeekLabel(week)}
                </span>
                <span className="text-sm text-gray-500 ml-auto">{week}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
