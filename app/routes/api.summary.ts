import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { getCachedRunSummary, runSummary } from "../../lib/summary";
import { saveSummaryToGitHub } from "../../lib/github-persist";
import { buildBasecampSummary } from "../../lib/markdown";
import { isBasecampConfigured, postWeeklySummaryToBasecamp } from "../../lib/basecamp-post";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const checkIns = (formData.get("checkIns") as string) ?? "";
  const todayOnly = formData.get("todayOnly") === "on";
  const shouldSave = formData.get("save") === "true";
  const postToBasecamp = formData.get("postToBasecamp") === "true";

  try {
    // This used runSummary unconditionally, so every click on Generate paid
    // for a full ~800-request cold run even when the dashboard had fetched the
    // same week seconds earlier. Reuse that work — but only when there is no
    // check-in text, since the cache key does not include it and a cached run
    // would silently drop what the user typed.
    const summaryArgs = {
      todayMode: todayOnly,
      checkInsText: checkIns,
      outputDir: null,
    };
    const result = checkIns.trim()
      ? await runSummary(summaryArgs)
      : await getCachedRunSummary(summaryArgs);

    let basecampPosted = false;
    let basecampError: string | undefined;

    if (shouldSave) {
      const repoSpec = process.env.GITHUB_REPO ?? "nlewis84/weekly-summary";
      await saveSummaryToGitHub(result.payload, repoSpec);

      if (postToBasecamp && isBasecampConfigured()) {
        const markdown = buildBasecampSummary(result.payload);
        const bcResult = await postWeeklySummaryToBasecamp(
          result.payload.meta.week_ending,
          markdown
        );
        basecampPosted = bcResult.ok;
        basecampError = bcResult.error;
      }

      return data({
        payload: result.payload,
        saved: true,
        basecampPosted,
        basecampError,
        builtAt: new Date().toISOString(),
        weekEnding: result.payload.meta.week_ending,
      });
    }

    return data({ payload: result.payload });
  } catch (err) {
    console.error("Summary error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
