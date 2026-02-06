import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { postToSlack } from "../../lib/slack";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const body = await request.json().catch(() => ({}));
  const text = typeof body?.text === "string" ? body.text : "";

  if (!text.trim()) {
    return data({ ok: false, error: "Missing text" }, { status: 400 });
  }

  const result = await postToSlack(text);
  return data(result, result.ok ? 200 : 400);
}
