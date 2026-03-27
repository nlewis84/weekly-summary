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

/**
 * Formats a daily snapshot into check-in text with a day header.
 * Includes key metrics and item titles so the weekly summary
 * generator can reference them.
 */
export function formatSnapshotAsCheckIn(date: string, payload: Payload): string {
  const dayName = dayNameFor(date);
  const { stats, github, linear } = payload;
  const lines: string[] = [`${dayName}:`];

  if (stats.prs_merged > 0) {
    lines.push(`- Merged ${stats.prs_merged} PR${stats.prs_merged === 1 ? "" : "s"}`);
    for (const pr of github.merged_prs) {
      lines.push(`  - ${pr.title}`);
    }
  }

  if (stats.pr_reviews > 0) {
    lines.push(`- Reviewed ${stats.pr_reviews} PR${stats.pr_reviews === 1 ? "" : "s"}`);
    for (const r of github.reviews) {
      lines.push(`  - ${r.title}`);
    }
  }

  if (stats.linear_completed > 0) {
    lines.push(`- Completed ${stats.linear_completed} Linear issue${stats.linear_completed === 1 ? "" : "s"}`);
    for (const issue of linear.completed_issues) {
      const id = (issue.identifier as string) ?? "";
      const title = (issue.title as string) ?? "";
      if (id || title) lines.push(`  - ${id} ${title}`.trim());
    }
  }

  if (stats.linear_worked_on > 0) {
    lines.push(`- Worked on ${stats.linear_worked_on} Linear issue${stats.linear_worked_on === 1 ? "" : "s"}`);
    for (const issue of linear.worked_on_issues) {
      const id = (issue.identifier as string) ?? "";
      const title = (issue.title as string) ?? "";
      if (id || title) lines.push(`  - ${id} ${title}`.trim());
    }
  }

  if (stats.commits_pushed > 0) {
    lines.push(`- Pushed ${stats.commits_pushed} commit${stats.commits_pushed === 1 ? "" : "s"}`);
  }

  if (stats.linear_issues_created > 0) {
    lines.push(`- Created ${stats.linear_issues_created} Linear issue${stats.linear_issues_created === 1 ? "" : "s"}`);
  }

  if (stats.linear_comments > 0) {
    lines.push(`- ${stats.linear_comments} Linear comment${stats.linear_comments === 1 ? "" : "s"}`);
  }

  if (stats.pr_comments > 0) {
    lines.push(`- ${stats.pr_comments} PR comment${stats.pr_comments === 1 ? "" : "s"}`);
  }

  if (lines.length === 1) {
    lines.push("- No activity recorded");
  }

  return lines.join("\n");
}
