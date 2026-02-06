import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { listWeeklySummaries } from "../../lib/github-fetch";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const weeks = await listWeeklySummaries();
    return data({ weeks });
  } catch (err) {
    console.error("History list error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
