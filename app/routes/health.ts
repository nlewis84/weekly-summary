import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

async function checkGitHub(): Promise<"ok" | "error"> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return "error";
  try {
    const res = await fetch("https://api.github.com/rate_limit", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    });
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

async function checkLinear(): Promise<"ok" | "error"> {
  const key = process.env.LINEAR_API_KEY;
  if (!key) return "error";
  try {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: key },
      body: JSON.stringify({ query: "query { viewer { id } }" }),
    });
    if (!res.ok) return "error";
    const json = (await res.json()) as { errors?: unknown[] };
    return json.errors ? "error" : "ok";
  } catch {
    return "error";
  }
}

/**
 * Health check endpoint for monitoring.
 * GET /health returns 200 with { ok: true, timestamp } when the app is healthy.
 * GET /health?deep=true also verifies GitHub and Linear API connectivity.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const url = new URL(request.url);
  const deep = url.searchParams.get("deep") === "true";

  if (!deep) {
    return data({ ok: true, timestamp: new Date().toISOString() });
  }

  const [github, linear] = await Promise.all([checkGitHub(), checkLinear()]);
  const ok = github === "ok" && linear === "ok";
  return data(
    { ok, timestamp: new Date().toISOString(), github, linear },
    { status: ok ? 200 : 503 }
  );
}
