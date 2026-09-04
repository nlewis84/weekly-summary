#!/usr/bin/env -S npx tsx
/**
 * Recompute pr_reviews / pr_comments (and the review-derived latency and repo
 * list) for saved weekly summaries.
 *
 * Both numbers were undercounted for any busy week: the reviewed-by search was
 * issued unpaginated, so it stopped at GitHub's 100-item page, and comments
 * were only read from the first 20 PRs of the run. Weeks under those limits are
 * already correct and are left untouched.
 *
 * Each summary is recomputed against the window recorded in its own
 * meta.window_start / meta.window_end, so a backfill never quietly changes what
 * period a saved week covers. Linear-derived fields are not touched — they are
 * paginated correctly and re-deriving them today would read current issue
 * states, not the states as of that week.
 *
 * Usage:
 *   npx tsx scripts/backfill-pr-review-counts.ts [--dry-run] [week ...]
 */
import "dotenv/config";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  fetchReviewsInWindow,
  searchAuthoredPRs,
  countPrCommentsInWindow,
} from "../lib/summary.js";
import { buildMarkdownSummary } from "../lib/markdown.js";
import { median } from "../lib/github-metrics.js";
import { SearchBudgetError } from "../lib/github-search.js";
import type { Payload, ReviewEntry } from "../lib/types.js";

const SUMMARY_DIR =
  process.env.GITHUB_SUMMARY_PATHS?.split(",")[0]?.trim() ||
  "2026-weekly-work-summaries";

const dryRun = process.argv.includes("--dry-run");
const onlyWeeks = process.argv
  .slice(2)
  .filter((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));

function headers(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is required");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

/**
 * A PR reviewed inside the window can keep receiving pushes long afterwards, so
 * the candidate search reaches past the window's end. Kept finite because an
 * open-ended search on an early-in-the-year week exceeds GitHub's 1,000-result
 * ceiling and would silently return fewer candidates than the week really had.
 */
const SEARCH_TAIL_DAYS = 120;

/** The search budget is 30/minute; wait it out rather than abandoning a week. */
async function withSearchRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      if (!(err instanceof SearchBudgetError) || attempt >= 5) throw err;
      const waitMs = Math.max(1000, err.resetAt - Date.now() + 1000);
      console.log(
        `  search budget exhausted; waiting ${Math.ceil(waitMs / 1000)}s`
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

function commentsUrlFor(htmlUrl: string): string | null {
  const m = htmlUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) return null;
  return `https://api.github.com/repos/${m[1]}/${m[2]}/issues/${m[3]}/comments`;
}

async function main() {
  const h = headers();
  const username = process.env.GITHUB_USERNAME ?? "nlewis84";

  const weeks = readdirSync(SUMMARY_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .filter((w) => onlyWeeks.length === 0 || onlyWeeks.includes(w))
    .sort();

  for (const week of weeks) {
    const jsonPath = join(SUMMARY_DIR, `${week}.json`);
    const payload = JSON.parse(readFileSync(jsonPath, "utf-8")) as Payload;
    const windowStart = new Date(payload.meta.window_start);
    const windowEnd = new Date(payload.meta.window_end);

    process.stdout.write(`${week}: recomputing… `);
    const searchUntil = new Date(
      windowEnd.getTime() + SEARCH_TAIL_DAYS * 24 * 60 * 60 * 1000
    );
    const reviews = await withSearchRetry(() =>
      fetchReviewsInWindow(windowStart, windowEnd, username, h, { searchUntil })
    );
    const authored = await withSearchRetry(() =>
      searchAuthoredPRs(windowStart, windowEnd, username, h)
    );

    const commentsUrls = [
      ...authored
        .map((pr) => (pr.comments_url as string | undefined) ?? null)
        .filter((u): u is string => !!u),
      ...reviews
        .map((r) => (r.url ? commentsUrlFor(r.url) : null))
        .filter((u): u is string => !!u),
    ];
    const prComments = await countPrCommentsInWindow(
      commentsUrls,
      username,
      windowStart,
      windowEnd,
      h
    );

    const latencies = reviews
      .map((r: ReviewEntry) => r.latency_hours)
      .filter((n): n is number => typeof n === "number");
    const medianLatency = median(latencies);

    const reviewRepos = reviews
      .map((r) => r.repo)
      .filter((r): r is string => !!r);
    const repos = [...new Set([...payload.stats.repos, ...reviewRepos])].sort();

    process.stdout.write(`${reviews.length} reviews, ${authored.length} authored PRs\n`);
    const before = {
      pr_reviews: payload.stats.pr_reviews,
      pr_comments: payload.stats.pr_comments,
    };
    const after = { pr_reviews: reviews.length, pr_comments: prComments };

    if (
      before.pr_reviews === after.pr_reviews &&
      before.pr_comments === after.pr_comments
    ) {
      console.log(
        `${week}: already correct (${before.pr_reviews} reviews, ${before.pr_comments} comments)`
      );
      continue;
    }

    // The bugs being repaired here only ever dropped activity, never invented
    // it. A recomputation that comes back *lower* is therefore the recomputation
    // being wrong — candidates aged out of the search index, a request failed —
    // not the saved week. Leave those alone rather than overwrite good data.
    if (
      after.pr_reviews < before.pr_reviews ||
      after.pr_comments < before.pr_comments
    ) {
      console.log(
        `${week}: SKIPPED — recount came back lower (reviews ${before.pr_reviews} → ${after.pr_reviews}, comments ${before.pr_comments} → ${after.pr_comments}); keeping saved values`
      );
      continue;
    }

    console.log(
      `${week}: reviews ${before.pr_reviews} → ${after.pr_reviews} | comments ${before.pr_comments} → ${after.pr_comments}`
    );
    if (dryRun) continue;

    payload.stats.pr_reviews = after.pr_reviews;
    payload.stats.pr_comments = after.pr_comments;
    payload.stats.median_review_latency_hours = medianLatency;
    payload.stats.repos = repos;
    payload.github.reviews = reviews;

    writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + "\n");
    writeFileSync(
      join(SUMMARY_DIR, `${week}.md`),
      buildMarkdownSummary(payload)
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
