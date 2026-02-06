/**
 * Persist weekly summary to GitHub repo via REST API.
 * Uses PUT /repos/{owner}/{repo}/contents/{path} for create/update.
 * Retries on 403/429 (rate limit) per GitHub ToS.
 */

import type { Payload } from "./types.js";
import { buildMarkdownSummary } from "./markdown.js";
import { fetchWithRetry } from "./github-api.js";

const GITHUB_API = "https://api.github.com";

async function putFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
): Promise<void> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const body: { message: string; content: string; sha?: string } = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
  };

  const existing = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (existing.ok) {
    const data = (await existing.json()) as { sha?: string };
    if (data.sha) body.sha = data.sha;
  }

  const res = await fetchWithRetry(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `GitHub API: ${res.status}`);
  }
}

export async function saveSummaryToGitHub(
  payload: Payload,
  repoSpec: string
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN required for GitHub persist");

  const [owner, repo] = repoSpec.split("/");
  if (!owner || !repo) throw new Error("GITHUB_REPO must be owner/repo");

  const weekEnding = payload.meta.week_ending;
  const basePath = "2026-weekly-work-summaries";

  await putFile(
    token,
    owner,
    repo,
    `${basePath}/${weekEnding}.json`,
    JSON.stringify(payload, null, 2),
    `Save weekly summary ${weekEnding}`
  );

  await putFile(
    token,
    owner,
    repo,
    `${basePath}/${weekEnding}.md`,
    buildMarkdownSummary(payload),
    `Save weekly summary ${weekEnding} (md)`
  );
}
