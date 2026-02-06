import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { fetchWeeklySummary } from "../../lib/github-fetch";

export async function loader({ request, params }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const week = params.week;
  if (!week || !/^\d{4}-\d{2}-\d{2}$/.test(week)) {
    return data({ error: "Invalid week format (expected YYYY-MM-DD)" }, { status: 400 });
  }

  try {
    const payload = await fetchWeeklySummary(week);
    if (!payload) {
      return data({ error: "Summary not found" }, { status: 404 });
    }
    return data({ payload });
  } catch (err) {
    console.error("History fetch error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
