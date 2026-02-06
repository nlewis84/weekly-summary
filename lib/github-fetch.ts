/**
 * Fetch historical weekly summaries from GitHub repo via REST API.
 * Supports multiple paths via GITHUB_SUMMARY_PATHS (comma-separated).
 * Default: 2026-weekly-work-summaries. Add 2025-weekly-work-summaries etc. for earlier years.
 */

import type { Payload } from "./types.js";
import { fetchWithRetry } from "./github-api.js";
import { dataCache } from "./cache.js";

const GITHUB_API = "https://api.github.com";
const DEFAULT_PATHS = "2026-weekly-work-summaries";

function getSummaryPaths(): string[] {
  const raw = process.env.GITHUB_SUMMARY_PATHS ?? DEFAULT_PATHS;
  return raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function getRepoSpec(): { owner: string; repo: string } {
  const spec = process.env.GITHUB_REPO ?? "nlewis84/weekly-summary";
  const [owner, repo] = spec.split("/");
  if (!owner || !repo) throw new Error("GITHUB_REPO must be owner/repo");
  return { owner, repo };
}

function getAuthHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN required for GitHub fetch");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
  };
}

interface GhContentItem {
  name: string;
  path: string;
  type: string;
  sha?: string;
}

/**
 * List all JSON and week-in-review MD files across configured summary paths.
 * Returns week_ending strings (e.g. "2026-01-31") sorted descending, deduplicated.
 * Includes: *.json (YYYY-MM-DD.json) and *-week-in-review.md (YYYY-MM-DD-week-in-review.md)
 */
export async function listWeeklySummaries(options?: {
  bust?: boolean;
}): Promise<string[]> {
  const bust = options?.bust ?? false;
  const key = "history:weeks";
  if (!bust) {
    const cached = dataCache.get(key) as string[] | null;
    if (cached) return cached;
  }

  const { owner, repo } = getRepoSpec();
  const paths = getSummaryPaths();
  const allWeeks = new Set<string>();

  for (const basePath of paths) {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${basePath}`;
    const res = await fetchWithRetry(url, { headers: getAuthHeaders() });
    if (res.status === 404) continue;
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(err.message ?? `GitHub API: ${res.status}`);
    }
    const items = (await res.json()) as GhContentItem[];
    for (const f of items) {
      if (f.type !== "file") continue;
      if (f.name.endsWith(".json")) {
        const name = f.name.replace(/\.json$/, "");
        if (/^\d{4}-\d{2}-\d{2}$/.test(name)) allWeeks.add(name);
      } else if (f.name.endsWith("-week-in-review.md")) {
        const match = f.name.match(/^(\d{4}-\d{2}-\d{2})-week-in-review\.md$/);
        if (match) allWeeks.add(match[1]);
      }
    }
  }

  const result = [...allWeeks].sort((a, b) => b.localeCompare(a));
  dataCache.set(key, result);
  return result;
}

export type WeeklySummaryResult =
  | Payload
  | { type: "markdown"; week_ending: string; content: string };

/**
 * Fetch a single weekly summary by week_ending (e.g. "2026-01-31").
 * Tries .json first, then -week-in-review.md. Returns Payload for JSON, or markdown result for .md.
 */
export async function fetchWeeklySummary(
  weekEnding: string,
  options?: { bust?: boolean }
): Promise<Payload | null> {
  const result = await fetchWeeklySummaryRaw(weekEnding, options);
  if (!result) return null;
  if ("type" in result && result.type === "markdown") return null; // Charts/History detail need Payload
  return result as Payload;
}

/**
 * Fetch weekly summary as Payload or raw markdown. Use for History page to show both.
 */
export async function fetchWeeklySummaryRaw(
  weekEnding: string,
  options?: { bust?: boolean }
): Promise<WeeklySummaryResult | null> {
  const bust = options?.bust ?? false;
  const key = `history:week:${weekEnding}`;
  if (!bust) {
    const cached = dataCache.get(key) as WeeklySummaryResult | null | undefined;
    if (cached !== undefined) return cached;
  }

  const { owner, repo } = getRepoSpec();
  const paths = getSummaryPaths();
  const year = weekEnding.slice(0, 4);
  const yearPath = `${year}-weekly-work-summaries`;
  const orderedPaths = paths.includes(yearPath)
    ? [yearPath, ...paths.filter((p) => p !== yearPath)]
    : paths;

  for (const basePath of orderedPaths) {
    const jsonPath = `${basePath}/${weekEnding}.json`;
    const jsonUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${jsonPath}`;
    const jsonRes = await fetchWithRetry(jsonUrl, {
      headers: getAuthHeaders(),
    });
    if (jsonRes.ok) {
      const data = (await jsonRes.json()) as {
        content?: string;
        encoding?: string;
      };
      if (!data.content || data.encoding !== "base64") {
        throw new Error("Invalid GitHub content response");
      }
      const raw = Buffer.from(data.content, "base64").toString("utf8");
      const result = JSON.parse(raw) as Payload;
      dataCache.set(key, result);
      return result;
    }

    const mdPath = `${basePath}/${weekEnding}-week-in-review.md`;
    const mdUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${mdPath}`;
    const mdRes = await fetchWithRetry(mdUrl, { headers: getAuthHeaders() });
    if (mdRes.ok) {
      const data = (await mdRes.json()) as {
        content?: string;
        encoding?: string;
      };
      if (data.content && data.encoding === "base64") {
        const content = Buffer.from(data.content, "base64").toString("utf8");
        const result = {
          type: "markdown" as const,
          week_ending: weekEnding,
          content,
        };
        dataCache.set(key, result);
        return result;
      }
    }
  }
  dataCache.set(key, null);
  return null;
}
