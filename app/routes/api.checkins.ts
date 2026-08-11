import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { isBasecampConfigured } from "../../lib/basecamp-post";
import {
  fetchMyRecentCheckIns,
  type CheckInKind,
} from "../../lib/basecamp-fetch";

function parseKind(raw: string | null): CheckInKind {
  if (raw === "weekly" || raw === "all" || raw === "daily") return raw;
  return "daily";
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ answers: [], error: "Method not allowed" }, { status: 405 });
  }

  if (!isBasecampConfigured()) {
    return data(
      { answers: [], error: "Basecamp is not configured" },
      { status: 501 }
    );
  }

  try {
    const url = new URL(request.url);
    const limit = Math.min(
      Number(url.searchParams.get("limit")) || 50,
      100
    );
    const kind = parseKind(
      url.searchParams.get("kind") ?? url.searchParams.get("view")
    );
    const answers = await fetchMyRecentCheckIns({ limit, kind });
    return data({ answers, error: null });
  } catch (err) {
    console.error("Check-ins fetch error:", err);
    return data({ answers: [], error: (err as Error).message }, { status: 500 });
  }
}
