/**
 * Fetch historical weekly summaries from GitHub repo via REST API.
 * Lists JSON files in 2026-weekly-work-summaries/ and fetches individual file content.
 */

import type { Payload } from "./types.js";
import { fetchWithRetry } from "./github-api.js";

const GITHUB_API = "https://api.github.com";
const BASE_PATH = "2026-weekly-work-summaries";

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
 * List all JSON files in the summaries directory.
 * Returns week_ending strings (e.g. "2026-01-31") sorted descending.
 */
export async function listWeeklySummaries(): Promise<string[]> {
  const { owner, repo } = getRepoSpec();
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${BASE_PATH}`;

  const res = await fetchWithRetry(url, { headers: getAuthHeaders() });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `GitHub API: ${res.status}`);
  }

  const items = (await res.json()) as GhContentItem[];
  const jsonFiles = items.filter((f) => f.type === "file" && f.name.endsWith(".json"));
  const weekEndings = jsonFiles
    .map((f) => f.name.replace(/\.json$/, ""))
    .filter((name) => /^\d{4}-\d{2}-\d{2}$/.test(name))
    .sort((a, b) => b.localeCompare(a));

  return weekEndings;
}

/**
 * Fetch a single weekly summary by week_ending (e.g. "2026-01-31").
 */
export async function fetchWeeklySummary(weekEnding: string): Promise<Payload | null> {
  const { owner, repo } = getRepoSpec();
  const path = `${BASE_PATH}/${weekEnding}.json`;
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;

  const res = await fetchWithRetry(url, { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `GitHub API: ${res.status}`);
  }

  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content || data.encoding !== "base64") {
    throw new Error("Invalid GitHub content response");
  }

  const raw = Buffer.from(data.content, "base64").toString("utf8");
  return JSON.parse(raw) as Payload;
}
