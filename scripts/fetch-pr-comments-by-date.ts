#!/usr/bin/env -S npx tsx
import "dotenv/config";

/**
 * Fetch PR comment counts by querying repo comment endpoints and filtering by date.
 * Uses: Search API for PRs where user commented, then Issues API for comments per PR.
 *
 * Usage: GITHUB_TOKEN=xxx npx tsx scripts/fetch-pr-comments-by-date.ts
 *        GITHUB_TOKEN=xxx GITHUB_USERNAME=nlewis84 npx tsx scripts/fetch-pr-comments-by-date.ts
 */

const GITHUB_API = "https://api.github.com";
const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME ?? "nlewis84";

if (!token) {
  console.error("Set GITHUB_TOKEN");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
};

// Week windows (UTC) - matches meta in JSON files
const WEEKS = [
  { label: "2026-01-02", start: "2025-12-27T06:00:00Z", end: "2026-01-03T00:00:00Z" },
  { label: "2026-01-09", start: "2026-01-03T06:00:00Z", end: "2026-01-10T00:00:00Z" },
  { label: "2026-01-16", start: "2026-01-10T06:00:00Z", end: "2026-01-17T00:00:00Z" },
  { label: "2026-01-23", start: "2026-01-17T06:00:00Z", end: "2026-01-24T00:00:00Z" },
] as const;

function inRange(createdAt: string, start: string, end: string): boolean {
  const t = new Date(createdAt).getTime();
  return t >= new Date(start).getTime() && t < new Date(end).getTime();
}

async function fetchAll<T>(url: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  while (true) {
    const u = `${url}${url.includes("?") ? "&" : "?"}per_page=100&page=${page}`;
    const r = await fetch(u, { headers });
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${u}`);
    const data = await r.json();
    if (Array.isArray(data)) {
      if (data.length === 0) break;
      all.push(...data);
      if (data.length < 100) break;
    } else if (data.items) {
      if (data.items.length === 0) break;
      all.push(...data.items);
      if (data.items.length < 100) break;
    } else {
      break;
    }
    page++;
    await new Promise((resolve) => setTimeout(resolve, 100)); // avoid rate limit
  }
  return all;
}

async function main() {
  // 1. Search for PRs where user commented in ApollosProject (cast wide net on dates)
  const searchUrl = `${GITHUB_API}/search/issues?q=commenter:${username}+org:ApollosProject+type:pr+updated:>=2025-12-01`;
  console.error("Fetching PRs where you commented...");
  const prs = await fetchAll<{
    html_url: string;
    repository_url: string;
    number: number;
    comments_url?: string;
  }>(searchUrl);

  // Extract unique repo+number (search can return duplicates)
  const seen = new Set<string>();
  const unique = prs.filter((pr) => {
    const key = `${pr.repository_url}#${pr.number}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.error(`Found ${unique.length} PRs with your comments. Fetching comments...`);

  // 2. For each PR, fetch issue comments (PR conversation comments)
  const counts = WEEKS.map(() => 0);
  let fetched = 0;

  for (const pr of unique) {
    const match = pr.repository_url.match(/repos\/([^/]+\/[^/]+)/);
    if (!match) continue;
    const repo = match[1];
    const commentsUrl = `${GITHUB_API}/repos/${repo}/issues/${pr.number}/comments`;

    try {
      const comments = await fetchAll<{ user?: { login?: string }; created_at?: string }>(commentsUrl);
      for (const c of comments) {
        if (c.user?.login !== username || !c.created_at) continue;
        for (let i = 0; i < WEEKS.length; i++) {
          if (inRange(c.created_at, WEEKS[i].start, WEEKS[i].end)) {
            counts[i]++;
          }
        }
      }
      fetched++;
      if (fetched % 20 === 0) console.error(`  Fetched ${fetched}/${unique.length}...`);
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (e) {
      console.error(`  Skip ${repo}#${pr.number}: ${e}`);
    }
  }

  console.error("Done.\n");
  console.log("PR comments by week (ApollosProject, issue/conversation comments only):\n");
  for (let i = 0; i < WEEKS.length; i++) {
    console.log(`Week ending ${WEEKS[i].label}: ${counts[i]}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
