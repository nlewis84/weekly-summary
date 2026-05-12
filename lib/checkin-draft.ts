import { formatSnapshotAsCheckIn } from "./daily-snapshot.js";
import type { GranolaNoteForCheckIn } from "./granola-client.js";
import type { Payload } from "./types.js";

const SOFT_CAP_DEFAULT = 200;

/** Collapses whitespace; trims at last sentence end (. / ? / !) within first max+1 chars, else returns full text. */
export function softCap(text: string, max = SOFT_CAP_DEFAULT): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  const window = collapsed.slice(0, max + 1);
  let bestEnd = -1;
  for (const sep of [". ", "? ", "! "] as const) {
    let from = 0;
    while (from <= window.length) {
      const idx = window.indexOf(sep, from);
      if (idx === -1) break;
      const endExclusive = idx + 1;
      if (endExclusive > bestEnd) bestEnd = endExclusive;
      from = idx + 1;
    }
  }
  if (bestEnd > 0) return collapsed.slice(0, bestEnd).trimEnd();
  return collapsed;
}

function extractFallbackLines(fallbackText: string): string[] {
  const out: string[] = [];
  for (const raw of fallbackText.split(/\r?\n/)) {
    const leading = raw.length - raw.trimStart().length;
    if (leading > 0) continue;
    const t = raw.trim();
    if (t) out.push(t);
  }
  return out;
}

/**
 * Top-level markdown bullets and headings only (no indented sub-bullets).
 * Prefers markdown; if empty after parse, uses fallback plain text split on newlines.
 */
export function extractTopLevelBullets(
  markdown: string,
  fallbackText: string
): string[] {
  const md = markdown?.trim();
  if (!md) return extractFallbackLines(fallbackText);

  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  let inFence = false;

  for (const line of lines) {
    const fenceMatch = line.trim().match(/^```/);
    if (fenceMatch) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const leading = line.length - line.trimStart().length;
    if (leading > 0) continue;

    const t = line.trim();
    if (!t) continue;

    const bulletMatch = t.match(/^[-*+]\s+(.*)$/);
    if (bulletMatch) {
      const content = bulletMatch[1].trim();
      if (content) out.push(content);
      continue;
    }

    const headingMatch = t.match(/^#{1,6}\s+(.*)$/);
    if (headingMatch) {
      const content = headingMatch[1].trim();
      if (content) out.push(content);
    }
  }

  if (out.length === 0 && fallbackText.trim()) {
    return extractFallbackLines(fallbackText);
  }
  return out;
}

/**
 * Basecamp daily check-in body: GitHub/Linear snapshot lines plus optional Granola meeting bullets.
 */
export function buildDailyCheckInDraft(
  date: string,
  payload: Payload,
  meetingNotes?: GranolaNoteForCheckIn[]
): string {
  const work = formatSnapshotAsCheckIn(date, payload);
  if (!meetingNotes?.length) return work;

  const lines: string[] = [work, "", "Meetings", ""];
  for (const n of meetingNotes) {
    const title = (n.title ?? "Meeting").trim() || "Meeting";
    lines.push(`- ${title}`);
    const children = extractTopLevelBullets(
      n.summaryMarkdown ?? "",
      n.summaryText
    );
    for (const child of children) {
      const capped = softCap(child, SOFT_CAP_DEFAULT);
      if (capped) lines.push(`  - ${capped}`);
    }
  }
  return lines.join("\n").trimEnd();
}
