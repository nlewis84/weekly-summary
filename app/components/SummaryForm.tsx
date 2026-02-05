import { useFetcher } from "react-router";
import { MetricsCard } from "./MetricsCard";

export function SummaryForm() {
  const fetcher = useFetcher<{ payload?: { stats: Parameters<typeof MetricsCard>[0]["stats"] }; error?: string }>();
  const isSubmitting = fetcher.state !== "idle";
  const data = fetcher.data;

  return (
    <div className="space-y-6">
      <fetcher.Form method="post" action="/api/summary" className="space-y-4">
        <div>
          <label htmlFor="checkIns" className="block text-sm font-medium text-gray-700 mb-2">
            Check-ins (optional)
          </label>
          <textarea
            id="checkIns"
            name="checkIns"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 shadow-[var(--shadow-skeuo-inset)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-colors"
            placeholder="Monday: PR reviews&#10;Tuesday: Worked on feature X..."
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="todayOnly"
            name="todayOnly"
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="todayOnly" className="text-sm text-gray-700">
            Today only
          </label>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-[var(--shadow-skeuo-button-hover)] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-medium rounded-xl shadow-[var(--shadow-skeuo-button)] transition-all duration-300 active:translate-y-0 active:shadow-[var(--shadow-skeuo-button)]"
        >
          {isSubmitting ? "Generating…" : "Generate"}
        </button>
      </fetcher.Form>

      {data?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl shadow-[var(--shadow-skeuo-inset)] text-sm text-red-700">
          {data.error}
        </div>
      )}

      {data?.payload?.stats && (
        <MetricsCard stats={data.payload.stats} />
      )}
    </div>
  );
}
