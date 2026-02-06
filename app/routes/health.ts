import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

/**
 * Health check endpoint for monitoring.
 * GET /health returns 200 with { ok: true, timestamp } when the app is healthy.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ ok: false, error: "Method not allowed" }, { status: 405 });
  }
  return data({ ok: true, timestamp: new Date().toISOString() });
}
