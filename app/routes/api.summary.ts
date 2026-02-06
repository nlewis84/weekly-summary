import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { runSummary } from "../../lib/summary";
import { saveSummaryToGitHub } from "../../lib/github-persist";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const checkIns = (formData.get("checkIns") as string) ?? "";
  const todayOnly = formData.get("todayOnly") === "on";
  const shouldSave = formData.get("save") === "true";

  try {
    const result = await runSummary({
      todayMode: todayOnly,
      checkInsText: checkIns,
      outputDir: null,
    });

    if (shouldSave) {
      const repoSpec = process.env.GITHUB_REPO ?? "nlewis84/weekly-summary";
      await saveSummaryToGitHub(result.payload, repoSpec);
      return data({ payload: result.payload, saved: true });
    }

    return data({ payload: result.payload });
  } catch (err) {
    console.error("Summary error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
