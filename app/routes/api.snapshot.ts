import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { getCachedRunSummary } from "../../lib/summary";
import { saveDailySnapshot } from "../../lib/daily-snapshot";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const mode = (formData.get("mode") as string) ?? "today";
  const isYesterday = mode === "yesterday";

  const dateOverride = formData.get("date") as string | null;

  try {
    const result = await getCachedRunSummary({
      todayMode: !isYesterday,
      yesterdayMode: isYesterday,
      checkInsText: "",
      outputDir: null,
    });

    const snapshotDate =
      dateOverride || result.payload.meta.window_start.slice(0, 10);
    saveDailySnapshot(snapshotDate, result.payload);

    return data({ ok: true, date: snapshotDate });
  } catch (err) {
    console.error("Snapshot capture error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
