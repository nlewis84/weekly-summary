import { useLoaderData, Link } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { fetchWeeklySummary } from "../../lib/github-fetch";
import { MetricsCard } from "~/components/MetricsCard";
import { ArrowLeft } from "phosphor-react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const week = params.week;
  if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    return data({ error: "Invalid week format", payload: null });
  }

  try {
    const payload = await fetchWeeklySummary(week);
    return data({ payload, week, error: null as string | null });
  } catch (err) {
    console.error("History week loader error:", err);
    return data({ error: (err as Error).message, payload: null, week });
  }
}

function formatWeekLabel(weekEnding: string): string {
  const d = new Date(weekEnding);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function HistoryWeek() {
  const { payload, error, week } = useLoaderData<typeof loader>() as {
    payload: import("../../lib/types").Payload | null;
    error: string | null;
    week: string;
  };

  return (
    <div className="space-y-6">
      <Link
        to="/history"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-500 transition-colors"
      >
        <ArrowLeft size={18} weight="regular" />
        Back to History
      </Link>

      <h2 className="text-lg font-semibold text-gray-900">
        Week ending {week ? formatWeekLabel(week) : "—"}
      </h2>

      {error && (
        <div className="p-4 bg-[var(--color-error-bg)] border border-[var(--color-error-border)] rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {payload ? (
        <MetricsCard stats={payload.stats} payload={payload} />
      ) : !error ? (
        <div className="bg-gray-50 rounded-xl shadow-[var(--shadow-skeuo-card)] p-8 text-center text-gray-500 border border-gray-200">
          Summary not found.
        </div>
      ) : null}
    </div>
  );
}
