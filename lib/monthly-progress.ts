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

import { dataCache } from "./cache.js";
import { SearchBudgetError, searchRequest } from "./github-search.js";
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

/** Served from cache without asking GitHub again. */
const MONTHLY_TTL_MS = 15 * 60 * 1000;
/**
 * Floor between live searches for one month, which even an explicit refresh
 * will not go under. The home page auto-refreshes on a timer and passes `bust`
 * every time, so without this the search runs on that cadence forever — and
 * GitHub's search API allows only 30 requests a minute, a separate and much
 * tighter budget than the 5,000/hour core limit.
 */
const MIN_REFETCH_MS = 10 * 60 * 1000;

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
    // "low": the month-to-date count is the first thing to give way when the
    // search budget runs short, and the gate refuses locally rather than
    // spending a request to discover that it is out.
    const res = await searchRequest(url, headers, { priority: "low" });
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
 * keep serving objects built by the old shape until the TTL lapses.
 */
const MONTHLY_CACHE_VERSION = 2;

/** Pure: turn the month's merged PRs into the shape the card renders. */
export function buildProgress(
  month: string,
  prs: MonthlyMergedPr[],
  now: Date
): MonthlyProgress {
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

  return {
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
    stale: false,
  };
}

/**
 * Last successful result per month, kept past the cache TTL on purpose. When
 * GitHub refuses a search there is nothing better to show than the number we
 * last knew to be true, and a slightly old count beats an error banner.
 */
const lastGood = new Map<string, { progress: MonthlyProgress; fetchedAt: number }>();

/**
 * Searches in flight per month. Two page loads landing together previously
 * issued two identical searches; now the second awaits the first.
 */
const inFlight = new Map<string, Promise<MonthlyProgress>>();

/** Test seam: swap the network call without standing up a server. */
export type SearchFn = (month: string) => Promise<MonthlyMergedPr[]>;

function defaultSearch(month: string): Promise<MonthlyMergedPr[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Promise.reject(
      new Error("GITHUB_TOKEN required for monthly progress")
    );
  }
  return searchMergedPrs(month, {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  });
}

export async function getMonthlyProgress(
  month: string,
  options?: { bust?: boolean; now?: Date; search?: SearchFn }
): Promise<MonthlyProgress> {
  const bust = options?.bust ?? false;
  const now = options?.now ?? new Date();
  const search = options?.search ?? defaultSearch;
  const key = `monthly:v${MONTHLY_CACHE_VERSION}:${month}`;

  if (!bust) {
    const cached = dataCache.get(key) as MonthlyProgress | undefined;
    if (cached) return cached;
  }

  const previous = lastGood.get(month);
  // The refresh floor applies even to `bust`: the page's auto-refresh busts on
  // a timer, and month-to-date counts do not move fast enough to be worth a
  // search every cycle.
  if (previous && now.getTime() - previous.fetchedAt < MIN_REFETCH_MS) {
    return previous.progress;
  }

  const running = inFlight.get(month);
  if (running) return running;

  const request = search(month)
    .then((prs) => {
      const progress = buildProgress(month, prs, now);
      dataCache.set(key, progress, MONTHLY_TTL_MS);
      lastGood.set(month, { progress, fetchedAt: now.getTime() });
      return progress;
    })
    .catch((err: unknown) => {
      if (previous) {
        const why =
          err instanceof SearchBudgetError
            ? "search budget held back for today and this week"
            : (err as Error).message;
        console.warn(`Monthly progress: serving cached ${month} (${why})`);
        // Do not touch fetchedAt — the floor is measured from the last good
        // fetch, so a failure does not push the next attempt further out.
        return { ...previous.progress, stale: true };
      }
      throw err;
    })
    .finally(() => {
      inFlight.delete(month);
    });

  inFlight.set(month, request);
  return request;
}

/** Test helper — the module-level caches outlive individual test cases. */
export function resetMonthlyProgressCache(): void {
  lastGood.clear();
  inFlight.clear();
}
