import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Payload } from "./types.js";

const SNAPSHOT_DIR = join(process.cwd(), "daily-snapshots");

function ensureDir(): void {
  if (!existsSync(SNAPSHOT_DIR)) {
    mkdirSync(SNAPSHOT_DIR, { recursive: true });
  }
}

export function saveDailySnapshot(date: string, payload: Payload): void {
  ensureDir();
  const filePath = join(SNAPSHOT_DIR, `${date}.json`);
  writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf8");
}

export interface SnapshotEntry {
  date: string;
  dayName: string;
  captured_at: string;
}

function dayNameFor(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Returns snapshots that fall within the 7-day window ending on `weekEnding`.
 */
export function listDailySnapshots(weekEnding: string): SnapshotEntry[] {
  if (!existsSync(SNAPSHOT_DIR)) return [];

  const end = new Date(weekEnding + "T23:59:59");
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const files = readdirSync(SNAPSHOT_DIR).filter((f) => f.endsWith(".json"));
  const entries: SnapshotEntry[] = [];

  for (const file of files) {
    const date = file.replace(".json", "");
    const d = new Date(date + "T12:00:00");
    if (d >= start && d <= end) {
      const filePath = join(SNAPSHOT_DIR, file);
      try {
        const raw = readFileSync(filePath, "utf8");
        const payload = JSON.parse(raw) as Payload;
        entries.push({
          date,
          dayName: dayNameFor(date),
          captured_at: payload.meta.generated_at,
        });
      } catch {
        entries.push({
          date,
          dayName: dayNameFor(date),
          captured_at: "",
        });
      }
    }
  }

  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
}

export function loadDailySnapshot(date: string): Payload | null {
  const filePath = join(SNAPSHOT_DIR, `${date}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8")) as Payload;
  } catch {
    return null;
  }
}

const MAX_BULLETS_PER_SECTION = 12;

function linearIssuePhrase(issue: Record<string, unknown>): string {
  const id = (issue.identifier as string) ?? "";
  const title = (issue.title as string) ?? "";
  if (id && title) return `${id}: ${title}`;
  return title || id;
}

function pushBullets(
  lines: string[],
  items: string[],
  max: number
): void {
  const shown = items.slice(0, max);
  for (const item of shown) {
    lines.push(`- ${item}`);
  }
  const rest = items.length - shown.length;
  if (rest > 0) {
    lines.push(`- …and ${rest} more (see Weekly Summary)`);
  }
}

/**
 * Basecamp-style check-in: day line + loose bullets (like a human list),
 * not stat headers with nested lists.
 */
export function formatSnapshotAsCheckIn(date: string, payload: Payload): string {
  const dayName = dayNameFor(date);
  const { stats, github, linear } = payload;
  const lines: string[] = [dayName, ""];

  const mergedTitles = github.merged_prs.map((p) => p.title).filter(Boolean);
  const reviewTitles = github.reviews.map((r) => r.title).filter(Boolean);
  const completedPhrases = linear.completed_issues
    .map(linearIssuePhrase)
    .filter(Boolean);
  const workedPhrases = linear.worked_on_issues
    .map(linearIssuePhrase)
    .filter(Boolean);

  if (mergedTitles.length > 0) {
    pushBullets(lines, mergedTitles, MAX_BULLETS_PER_SECTION);
  }

  if (reviewTitles.length > 0) {
    for (const t of reviewTitles.slice(0, MAX_BULLETS_PER_SECTION)) {
      lines.push(`- Reviewed: ${t}`);
    }
    if (reviewTitles.length > MAX_BULLETS_PER_SECTION) {
      lines.push(
        `- …and ${reviewTitles.length - MAX_BULLETS_PER_SECTION} more reviews`
      );
    }
  }

  if (completedPhrases.length > 0) {
    for (const p of completedPhrases.slice(0, MAX_BULLETS_PER_SECTION)) {
      lines.push(`- Done: ${p}`);
    }
    if (completedPhrases.length > MAX_BULLETS_PER_SECTION) {
      lines.push(
        `- …and ${completedPhrases.length - MAX_BULLETS_PER_SECTION} more completed issues`
      );
    }
  }

  if (workedPhrases.length > 0) {
    const completedSet = new Set(completedPhrases);
    const onlyWorked = workedPhrases.filter((p) => !completedSet.has(p));
    for (const p of onlyWorked.slice(0, MAX_BULLETS_PER_SECTION)) {
      lines.push(`- In progress: ${p}`);
    }
    if (onlyWorked.length > MAX_BULLETS_PER_SECTION) {
      lines.push(
        `- …and ${onlyWorked.length - MAX_BULLETS_PER_SECTION} more in-flight issues`
      );
    }
  }

  if (stats.linear_issues_created > 0) {
    lines.push(
      stats.linear_issues_created === 1
        ? "- Filed a new Linear ticket"
        : `- Filed ${stats.linear_issues_created} new Linear tickets`
    );
  }

  if (stats.prs_merged === 0 && stats.commits_pushed > 0) {
    lines.push(
      stats.commits_pushed === 1
        ? "- Pushed commits (no merges in this window)"
        : `- Pushed ${stats.commits_pushed} commits (no merges in this window)`
    );
  }

  if (stats.pr_comments > 0 || stats.linear_comments > 0) {
    lines.push(
      stats.pr_comments > 0 && stats.linear_comments > 0
        ? "- Left comments on PRs and in Linear"
        : stats.pr_comments > 0
          ? "- Left comments on PRs"
          : "- Replied in Linear"
    );
  }

  const bodyStart = 2;
  if (lines.length <= bodyStart) {
    lines.push("- Quiet in GitHub / Linear for this window");
  }

  return lines.join("\n").trimEnd();
}
