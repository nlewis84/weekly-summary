import { formatSnapshotAsCheckIn } from "./daily-snapshot.js";
import type { GranolaNoteForCheckIn } from "./granola-client.js";
import type { Payload } from "./types.js";

const MAX_SUMMARY_CHARS = 500;

function truncatePlain(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
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
    const summary = truncatePlain(n.summaryText, MAX_SUMMARY_CHARS);
    if (summary) {
      lines.push(`- ${title}: ${summary}`);
    } else {
      lines.push(`- ${title}`);
    }
  }
  return lines.join("\n").trimEnd();
}
