import { FileText } from "phosphor-react";
import { LottieIcon } from "./LottieIcon";
import { MetricsCard } from "./MetricsCard";
import type { Payload } from "../../lib/types";

interface FullSummaryFormProps {
  Form: React.ComponentType<
    React.FormHTMLAttributes<HTMLFormElement> & { children?: React.ReactNode }
  >;
  action: string;
  isSubmitting: boolean;
  error?: string;
  saved?: boolean;
  payload?: Payload | null;
}

export function FullSummaryForm({
  Form,
  action,
  isSubmitting,
  error,
  saved,
  payload,
}: FullSummaryFormProps) {
  return (
    <details className="bg-white rounded-xl shadow-[var(--shadow-skeuo-card)] border border-gray-200/90">
      <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer font-medium text-gray-900 list-none [&::-webkit-details-marker]:hidden">
        <FileText size={20} weight="regular" className="text-primary-600 shrink-0" />
        Build Weekly Summary
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-4">
        <Form method="post" action={action} className="space-y-4">
          <input type="hidden" name="save" value="true" />
          <div>
            <label htmlFor="checkIns" className="block text-sm font-medium text-gray-700 mb-2">
              Check-ins
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
            {isSubmitting ? "Generating…" : "Generate & Save"}
          </button>
        </Form>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        {saved && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-4">
            <LottieIcon name="check" size={48} loop={false} />
            <div>
              <p className="font-medium text-green-800">Saved to repository.</p>
              <p className="text-sm text-green-700 mt-0.5">Your weekly summary has been generated and committed.</p>
            </div>
          </div>
        )}

        {payload?.stats && <MetricsCard stats={payload.stats} payload={payload} />}
      </div>
    </details>
  );
}
