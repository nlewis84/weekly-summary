import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { runSummary } from "../../lib/summary";
import { saveSummaryToGitHub } from "../../lib/github-persist";
import { buildMarkdownSummary } from "../../lib/markdown";
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
    const result = await runSummary({
      todayMode: todayOnly,
      checkInsText: checkIns,
      outputDir: null,
    });

    let basecampPosted = false;
    let basecampError: string | undefined;

    if (shouldSave) {
      const repoSpec = process.env.GITHUB_REPO ?? "nlewis84/weekly-summary";
      await saveSummaryToGitHub(result.payload, repoSpec);

      if (postToBasecamp && isBasecampConfigured()) {
        const markdown = buildMarkdownSummary(result.payload);
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
