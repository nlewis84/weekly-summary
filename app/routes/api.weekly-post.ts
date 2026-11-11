import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { isBasecampConfigured } from "../../lib/basecamp-post";
import { postWeeklyCallouts } from "../../lib/weekly-preview.server";

const BODY_MAX_CHARS = 32_000;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }
  if (!isBasecampConfigured()) {
    return data({ error: "Basecamp is not configured" }, { status: 400 });
  }

  const formData = await request.formData();
  const weekEnding = String(formData.get("weekEnding") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return data({ error: "The callouts are empty" }, { status: 400 });
  if (body.length > BODY_MAX_CHARS) {
    return data({ error: `Callouts must be at most ${BODY_MAX_CHARS} characters` }, { status: 400 });
  }

  try {
    const result = await postWeeklyCallouts(weekEnding, body);
    if (!result.ok) {
      return data({ error: `Basecamp post failed: ${result.error}` }, { status: 502 });
    }
    return data({
      ok: true,
      basecampPosted: true,
      basecampError: result.warning,
      basecampUrl: result.appUrl,
    });
  } catch (err) {
    console.error("Weekly post error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
