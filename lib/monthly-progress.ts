/**
 * Month-to-date merged-PR progress against a monthly target.
 *
 * Counted straight from GitHub search rather than stitched from weekly
 * summaries and daily snapshots: a month rarely lines up with Sat–Fri weeks,
 * and days that were never captured would silently go missing. One search over
 * the month's merge window is exact and stays consistent with the PR counts the
 * rest of the app reports (same author, same org filter).
 *
 * Server-only — the pace math lives in `monthly-pace` so the browser can share
 * it without importing the cache or the GitHub client.
 */

import { fetchWithRetry } from "./github-api.js";
import { dataCache } from "./cache.js";
import {
  buildMonthDays,
  businessDaysInMonth,
  businessDaysThrough,
  currentMonth,
  daysInMonth,
  monthLabel,
  pad2,
  type MonthlyMergedPr,
  type MonthlyProgress,
} from "./monthly-pace.js";

export type {
  MonthlyDay,
  MonthlyMergedPr,
  MonthlyProgress,
  PaceSummary,
} from "./monthly-pace.js";
export {
  buildMonthDays,
  businessDaysInMonth,
  businessDaysThrough,
  computePace,
  currentMonth,
  daysInMonth,
  monthLabel,
} from "./monthly-pace.js";

const GITHUB_API_BASE = "https://api.github.com";
const SEARCH_PAGE_SIZE = 100;
/** 500 merged PRs in one month is far past any real month; a stop, not a limit. */
const MAX_SEARCH_PAGES = 5;

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

interface SearchItem {
  title?: string;
  html_url?: string;
  pull_request?: { merged_at?: string | null };
  closed_at?: string | null;
}

function repoFromUrl(url: string): string | null {
  const m = url.match(/github\.com\/[^/]+\/([^/]+)\/pull\/\d+/);
  return m ? m[1]! : null;
}

/** One day either side of the month, so a merge near midnight is not lost to UTC. */
function searchWindow(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number);
  const from = new Date(y, m - 1, 1);
  from.setDate(from.getDate() - 1);
  const to = new Date(y, m - 1, daysInMonth(month));
  to.setDate(to.getDate() + 1);
  return { from: toYmd(from), to: toYmd(to) };
}

async function searchMergedPrs(
  month: string,
  headers: HeadersInit
): Promise<MonthlyMergedPr[]> {
  const username = process.env.GITHUB_USERNAME ?? "nlewis84";
  const org = process.env.GITHUB_ORG ?? "ApollosProject";
  const { from, to } = searchWindow(month);
  const q = `author:${username}+type:pr+is:merged+org:${org}+merged:${from}..${to}`;

  const items: SearchItem[] = [];
  for (let page = 1; page <= MAX_SEARCH_PAGES; page++) {
    const url = `${GITHUB_API_BASE}/search/issues?q=${q}&per_page=${SEARCH_PAGE_SIZE}&page=${page}&sort=created&order=desc`;
    const res = await fetchWithRetry(url, { headers });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(err.message ?? `GitHub search failed: ${res.status}`);
    }
    const body = (await res.json()) as { items?: SearchItem[] };
    const batch = body.items ?? [];
    items.push(...batch);
    if (batch.length < SEARCH_PAGE_SIZE) break;
  }

  const prs: MonthlyMergedPr[] = [];
  for (const item of items) {
    const url = item.html_url;
    // Search results carry merged_at on the pull_request stub; closed_at is the
    // fallback, and `is:merged` guarantees the close was a merge.
    const mergedAt = item.pull_request?.merged_at ?? item.closed_at;
    if (!url || !mergedAt) continue;
    const day = toYmd(new Date(mergedAt));
    if (!day.startsWith(`${month}-`)) continue;
    prs.push({
      title: item.title ?? url,
      url,
      repo: repoFromUrl(url),
      merged_at: mergedAt,
      day,
    });
  }
  prs.sort((a, b) => b.merged_at.localeCompare(a.merged_at));
  return prs;
}

/**
 * Bump when MonthlyProgress changes shape — a running server would otherwise
 * keep serving objects built by the old shape until the 15-minute TTL lapses.
 */
const MONTHLY_CACHE_VERSION = 1;

export async function getMonthlyProgress(
  month: string,
  options?: { bust?: boolean; now?: Date }
): Promise<MonthlyProgress> {
  const bust = options?.bust ?? false;
  const now = options?.now ?? new Date();
  const key = `monthly:v${MONTHLY_CACHE_VERSION}:${month}`;
  if (!bust) {
    const cached = dataCache.get(key) as MonthlyProgress | undefined;
    if (cached) return cached;
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN required for monthly progress");
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const prs = await searchMergedPrs(month, headers);

  const nowMonth = currentMonth(now);
  const isCurrentMonth = month === nowMonth;
  const lastDay = daysInMonth(month);
  // A month still ahead of us has no elapsed days at all; `-00` sorts before
  // every real date, so every day reads as future.
  const throughDay = isCurrentMonth
    ? now.getDate()
    : month > nowMonth
      ? 0
      : lastDay;
  const through = `${month}-${pad2(throughDay)}`;

  const repoCounts = new Map<string, number>();
  for (const pr of prs) {
    const repo = pr.repo ?? "unknown";
    repoCounts.set(repo, (repoCounts.get(repo) ?? 0) + 1);
  }

  const result: MonthlyProgress = {
    month,
    label: monthLabel(month),
    merged: prs.length,
    days: buildMonthDays(month, prs, through),
    daysInMonth: lastDay,
    businessDaysInMonth: businessDaysInMonth(month),
    businessDaysElapsed: businessDaysThrough(month, throughDay),
    through,
    isCurrentMonth,
    topRepos: [...repoCounts.entries()]
      .map(([repo, count]) => ({ repo, count }))
      .sort((a, b) => b.count - a.count || a.repo.localeCompare(b.repo))
      .slice(0, 5),
    generated_at: now.toISOString(),
  };

  dataCache.set(key, result);
  return result;
}
