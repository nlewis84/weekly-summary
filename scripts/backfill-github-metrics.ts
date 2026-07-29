#!/usr/bin/env -S npx tsx
/**
 * Backfill code volume (additions/deletions/changed_files on merged PRs) and
 * review latency (requested_at → reviewed_at) for historical weekly summaries.
 *
 * Usage:
 *   GITHUB_TOKEN=xxx npx tsx scripts/backfill-github-metrics.ts
 *   GITHUB_TOKEN=xxx npx tsx scripts/backfill-github-metrics.ts --dry-run
 */
import "dotenv/config";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fetchWithRetry } from "../lib/github-api.js";
import { buildMarkdownSummary } from "../lib/markdown.js";
import {
  computeLatencyHours,
  findRequestedAt,
  median,
  parsePrRef,
  sumVolume,
  type TimelineEvent,
} from "../lib/github-metrics.js";
import type { MergedPr, Payload, ReviewEntry } from "../lib/types.js";

const dryRun = process.argv.includes("--dry-run");

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function fetchPrVolume(
  url: string,
  headers: Record<string, string>
): Promise<{ additions: number; deletions: number; changed_files: number } | null> {
  const ref = parsePrRef(url);
  if (!ref || ref.number <= 0) return null;
  const api = `https://api.github.com/repos/${ref.owner}/${ref.repo}/pulls/${ref.number}`;
  const res = await fetchWithRetry(api, { headers });
  if (!res.ok) {
    if (res.status !== 404) {
      console.error(`  PR detail ${ref.repo}#${ref.number}: HTTP ${res.status}`);
    }
    return null;
  }
  const d = (await res.json()) as {
    additions?: number;
    deletions?: number;
    changed_files?: number;
  };
  return {
    additions: d.additions ?? 0,
    deletions: d.deletions ?? 0,
    changed_files: d.changed_files ?? 0,
  };
}

async function fetchReviewMeta(
  url: string,
  username: string,
  windowStart: Date,
  windowEnd: Date,
  headers: Record<string, string>
): Promise<{
  reviewed_at: string | null;
  review_state: string | null;
  requested_at: string | null;
  latency_hours: number | null;
  repo: string | null;
}> {
  const ref = parsePrRef(url);
  if (!ref || ref.number <= 0) {
    return {
      reviewed_at: null,
      review_state: null,
      requested_at: null,
      latency_hours: null,
      repo: null,
    };
  }

  const reviewsUrl = `https://api.github.com/repos/${ref.owner}/${ref.repo}/pulls/${ref.number}/reviews`;
  const reviewsRes = await fetchWithRetry(reviewsUrl, { headers });
  let reviewed_at: string | null = null;
  let review_state: string | null = null;
  if (reviewsRes.ok) {
    const reviews = (await reviewsRes.json()) as Array<{
      user?: { login?: string };
      state?: string;
      submitted_at?: string | null;
    }>;
    const mine = reviews
      .filter(
        (r) =>
          r.user?.login === username &&
          r.submitted_at != null &&
          r.state !== "PENDING" &&
          new Date(r.submitted_at) >= windowStart &&
          new Date(r.submitted_at) <= windowEnd
      )
      .sort(
        (a, b) =>
          new Date(a.submitted_at!).getTime() -
          new Date(b.submitted_at!).getTime()
      );
    const first = mine[0];
    if (first?.submitted_at) {
      reviewed_at = first.submitted_at;
      review_state = first.state ?? "COMMENTED";
    }
  } else {
    console.error(
      `  Reviews ${ref.repo}#${ref.number}: HTTP ${reviewsRes.status}`
    );
  }

  let requested_at: string | null = null;
  if (reviewed_at) {
    const timelineUrl = `https://api.github.com/repos/${ref.owner}/${ref.repo}/issues/${ref.number}/timeline?per_page=100`;
    const tlRes = await fetchWithRetry(timelineUrl, {
      headers: {
        ...headers,
        Accept: "application/vnd.github.mockingbird-preview+json",
      },
    });
    if (tlRes.ok) {
      const events = (await tlRes.json()) as TimelineEvent[];
      requested_at = findRequestedAt(events, username, reviewed_at);
    } else {
      console.error(
        `  Timeline ${ref.repo}#${ref.number}: HTTP ${tlRes.status}`
      );
    }
  }

  return {
    reviewed_at,
    review_state,
    requested_at,
    latency_hours: computeLatencyHours(requested_at, reviewed_at),
    repo: ref.repo,
  };
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Set GITHUB_TOKEN");
    process.exit(1);
  }
  const username = process.env.GITHUB_USERNAME ?? "nlewis84";
  const headers = githubHeaders(token);

  const summariesDir = join(process.cwd(), "2026-weekly-work-summaries");
  const files = readdirSync(summariesDir)
    .filter((f) => f.endsWith(".json") && /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();

  if (files.length === 0) {
    console.error("No weekly JSON files found");
    process.exit(1);
  }

  console.error(
    `Backfilling ${files.length} weeks for @${username}${dryRun ? " (dry-run)" : ""}\n`
  );

  for (const file of files) {
    const path = join(summariesDir, file);
    const payload = JSON.parse(readFileSync(path, "utf8")) as Payload;
    const weekEnding = payload.meta?.week_ending ?? file.replace(".json", "");
    const windowStart = new Date(payload.meta.window_start);
    const windowEnd = new Date(payload.meta.window_end);

    const merged = payload.github?.merged_prs ?? [];
    const updatedMerged: MergedPr[] = [];
    for (const pr of merged) {
      const vol = await fetchPrVolume(pr.url, headers);
      updatedMerged.push({
        ...pr,
        additions: vol?.additions ?? pr.additions ?? 0,
        deletions: vol?.deletions ?? pr.deletions ?? 0,
        changed_files: vol?.changed_files ?? pr.changed_files ?? 0,
      });
    }

    const reviews = payload.github?.reviews ?? [];
    const updatedReviews: ReviewEntry[] = [];
    for (const r of reviews) {
      const meta = await fetchReviewMeta(
        r.url,
        username,
        windowStart,
        windowEnd,
        headers
      );
      updatedReviews.push({
        title: r.title,
        url: r.url,
        repo: meta.repo ?? r.repo ?? null,
        requested_at: meta.requested_at,
        reviewed_at: meta.reviewed_at ?? r.reviewed_at ?? null,
        review_state: meta.review_state ?? r.review_state ?? null,
        latency_hours: meta.latency_hours,
      });
    }

    const volume = sumVolume(updatedMerged);
    const latencyValues = updatedReviews
      .map((r) => r.latency_hours)
      .filter((h): h is number => typeof h === "number");
    const medianLatency = median(latencyValues);

    console.log(
      `${weekEnding}: volume +${volume.lines_added}/-${volume.lines_deleted} ` +
        `(${volume.files_changed} files) | reviews ${updatedReviews.length} ` +
        `| median latency ${medianLatency != null ? `${medianLatency}h` : "—"}`
    );

    if (dryRun) continue;

    const next: Payload = {
      ...payload,
      stats: {
        ...payload.stats,
        lines_added: volume.lines_added,
        lines_deleted: volume.lines_deleted,
        files_changed: volume.files_changed,
        median_review_latency_hours: medianLatency,
      },
      github: {
        ...payload.github,
        merged_prs: updatedMerged,
        open_prs: payload.github?.open_prs ?? [],
        reviews: updatedReviews,
      },
    };

    writeFileSync(path, JSON.stringify(next, null, 2), "utf8");
    const mdPath = join(summariesDir, `${weekEnding}.md`);
    writeFileSync(mdPath, buildMarkdownSummary(next), "utf8");
  }

  console.error("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
