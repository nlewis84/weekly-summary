/**
 * Parse *-week-in-review.md transcripts into Payload format.
 * Rule-based extraction for stats; narrative for formatted_output.
 */

import type { Payload, Stats } from "./types.js";

const WEEK_ENDING_RE = /# Week in review — (\d{4}-\d{2}-\d{2})/;

function parseWeekEnding(content: string): string | null {
  const m = content.match(WEEK_ENDING_RE);
  return m ? m[1] : null;
}

function extractStats(content: string): Partial<Stats> {
  const stats: Partial<Stats> = {};
  const lower = content.toLowerCase();

  // PRs merged: "21 PRs merged", "25 PRs that were merged"
  const mergedM = content.match(/(\d+)\s*PRs?\s*(?:that\s+were\s+)?merged|merged\s*(\d+)\s*PRs?/i);
  if (mergedM) stats.prs_merged = parseInt(mergedM[1] ?? mergedM[2] ?? "0", 10);

  // Total PRs: "25 total PRs", "31 PRs that were created or updated" (must have "total" or "created/updated" to avoid matching "X PRs merged")
  const totalM = content.match(/(\d+)\s+total\s+PRs?|(\d+)\s+PRs?\s+that\s+were\s+(?:created|updated)/i);
  if (totalM) stats.prs_total = parseInt(totalM[1] ?? totalM[2] ?? "0", 10);

  // Reviews: "16 PR reviews", "21 PR reviews", "reviewed 16 PRs"
  const reviewsM = content.match(/(\d+)\s*PR\s*reviews?|reviewed\s*(\d+)\s*PRs?/i);
  if (reviewsM) stats.pr_reviews = parseInt(reviewsM[1] ?? reviewsM[2] ?? "0", 10);

  // Linear completed: "29 linear issues that I completed", "linear issues completed was at 29"
  const linearDoneM = content.match(/(\d+)\s+linear\s+(?:issues?\s+)?(?:that\s+I\s+)?completed|linear\s+(?:issues?\s+)?completed\s+(?:was\s+at\s+)?(\d+)/i);
  if (linearDoneM) stats.linear_completed = parseInt(linearDoneM[1] ?? linearDoneM[2] ?? "0", 10);

  // Linear worked on: "35 total linear issues that I worked on", "linear issues worked on was 33"
  const linearWorkedM = content.match(/(\d+)\s+(?:total\s+)?linear\s+(?:issues?\s+)?(?:that\s+I\s+)?worked\s+on|linear\s+(?:issues?\s+)?worked\s+on\s+(?:was\s+)?(\d+)/i);
  if (linearWorkedM) stats.linear_worked_on = parseInt(linearWorkedM[1] ?? linearWorkedM[2] ?? "0", 10);

  // Commits pushed: "9 commits", "pushed 9 commits", "9 commits pushed"
  const commitsM = content.match(/(\d+)\s+commits?\s+pushed|pushed\s+(\d+)\s+commits?|(\d+)\s+commits?\s+(?:pushed|this week)/i);
  if (commitsM) stats.commits_pushed = parseInt(commitsM[1] ?? commitsM[2] ?? commitsM[3] ?? "0", 10);

  // Repos
  const repos: string[] = [];
  if (/\badmin\b|apollos-admin/i.test(lower)) repos.push("apollos-admin");
  if (/\bcluster\b|apollos-cluster/i.test(lower)) repos.push("apollos-cluster");
  if (repos.length > 0) stats.repos = [...new Set(repos)];

  return stats;
}

function stripTimestamps(content: string): string {
  return content
    .replace(/^\d+:\d+\s+/gm, "")
    .replace(/---\s*/g, "\n\n")
    .trim();
}

function buildNarrativeSummary(content: string, weekEnding: string): string {
  const stripped = stripTimestamps(content);
  const lines = stripped.split("\n").filter((l) => l.trim().length > 20);
  const excerpt = lines.slice(0, 15).join(" ").slice(0, 800);
  return `Week in review (${weekEnding}): ${excerpt}${excerpt.length >= 800 ? "…" : ""}`;
}

function getWindowForWeekEnding(weekEnding: string): { window_start: string; window_end: string } {
  const end = new Date(weekEnding + "T23:59:59.999Z");
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return {
    window_start: start.toISOString(),
    window_end: end.toISOString(),
  };
}

const DEFAULT_STATS: Stats = {
  prs_merged: 0,
  prs_total: 0,
  pr_reviews: 0,
  pr_comments: 0,
  commits_pushed: 0,
  linear_completed: 0,
  linear_worked_on: 0,
  linear_issues_created: 0,
  repos: ["apollos-admin"],
};

export function parseTranscriptToPayload(content: string): Payload | null {
  const weekEnding = parseWeekEnding(content);
  if (!weekEnding) return null;

  const extracted = extractStats(content);
  const stats: Stats = { ...DEFAULT_STATS, ...extracted };
  if (!stats.repos?.length) stats.repos = ["apollos-admin"];

  const { window_start, window_end } = getWindowForWeekEnding(weekEnding);

  const narrative = buildNarrativeSummary(content, weekEnding);
  const terminalBlock = [
    "╔══════════════════════════════════════════════════════════╗",
    "║     Weekly Work Summary (from transcript)                 ║",
    "╚══════════════════════════════════════════════════════════╝",
    "",
    "📋 Extracted from week-in-review transcript",
    "",
    `Stats: ${stats.prs_merged} PRs merged | ${stats.prs_total} total | ${stats.pr_reviews} reviews | ${stats.linear_completed} Linear completed | ${stats.linear_worked_on} worked on | ${stats.linear_issues_created} created`,
    "",
    narrative,
  ].join("\n");

  return {
    meta: {
      generated_at: new Date().toISOString(),
      window_start,
      window_end,
      week_ending: weekEnding,
      source_of_truth: "Week-in-review video transcript",
    },
    stats,
    linear: {
      completed_issues: [],
      worked_on_issues: [],
      created_issues: [],
    },
    github: {
      merged_prs: [],
      reviews: [],
    },
    check_ins: [{ day: "Week in review", content: narrative }],
    terminal_output: terminalBlock,
    formatted_output: narrative,
  };
}
