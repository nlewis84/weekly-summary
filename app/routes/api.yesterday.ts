import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { runSummary } from "../../lib/summary";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const result = await runSummary({
      todayMode: false,
      yesterdayMode: true,
      checkInsText: "",
      outputDir: null,
    });
    return data({ payload: result.payload });
  } catch (err) {
    console.error("Yesterday summary error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
