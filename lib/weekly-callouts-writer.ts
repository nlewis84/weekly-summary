import { readFileSync } from "node:fs";
import path from "node:path";
import { compactPayload, extractJsonObject, runClaude, unwrap } from "./checkin-writer.js";
import type { GranolaNoteForCheckIn } from "./granola-client.js";
import type { MentionRules, RosterPersonPublic } from "./checkin-types.js";
import type { Payload } from "./types.js";

// process.cwd(), not import.meta.url: the server build bundles lib/ into build/server/.
const PROMPT_PATH = path.join(process.cwd(), "config", "weekly-callouts-prompt.md");
// Sonnet pages through a week of Slack, which takes longer than the daily run.
const TIMEOUT_MS = 300_000;
const GRANOLA_SUMMARY_MAX = 1500;

export interface DailyCheckInForWeek {
  date: string;
  text: string;
}

export interface WriteWeeklyInput {
  weekEnding: string;
  payload: Payload;
  dailies: DailyCheckInForWeek[];
  meetingNotes: GranolaNoteForCheckIn[];
  roster: RosterPersonPublic[];
  rules: MentionRules;
}

export interface WeeklyWriterResult {
  draft: string;
  notes?: string;
  usedFallback: boolean;
}

function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayName(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

/** Monday through Friday for a Friday week-ending date. */
export function weekDates(weekEnding: string): { monday: string; sunday: string; saturday: string } {
  return {
    monday: shiftDate(weekEnding, -4),
    sunday: shiftDate(weekEnding, -5),
    saturday: shiftDate(weekEnding, 1),
  };
}

export function buildWeeklyPrompt(input: WriteWeeklyInput): string {
  const base = readFileSync(PROMPT_PATH, "utf8").trim();
  const { monday, sunday, saturday } = weekDates(input.weekEnding);
  const ambiguous = new Set(input.rules.ambiguous.map((n) => n.toLowerCase()));
  const roster = input.roster
    .filter((p) => !/^nathan\b/i.test(p.name))
    .map((p) => (ambiguous.has(p.firstName.toLowerCase()) ? `${p.name} (ambiguous first name)` : p.name));
  const meetings = input.meetingNotes.map((n) => ({
    title: n.title ?? "Meeting",
    summary: (n.summaryMarkdown || n.summaryText || "").slice(0, GRANOLA_SUMMARY_MAX),
  }));

  return [
    base,
    "",
    `Week: Monday ${monday} through Friday ${input.weekEnding}. Slack filter dates: after:${sunday} before:${saturday}.`,
    "",
    "Daily check-ins this week:",
    input.dailies.length
      ? input.dailies.map((d) => `${d.date} (${weekdayName(d.date)}):\n${d.text}`).join("\n\n")
      : "(none found)",
    "",
    "Week's GitHub and Linear data (JSON):",
    JSON.stringify(compactPayload(input.payload)),
    "",
    "Granola meetings (JSON, private):",
    JSON.stringify(meetings),
    "",
    `Taggable roster: ${roster.join(", ") || "(none)"}`,
    `Ambiguous first names: ${input.rules.ambiguous.join(", ")}`,
    `Plain names (never @): ${input.rules.plain.join(", ")}`,
    "",
    "Reply with ONLY the JSON object.",
  ].join("\n");
}

function parseCallouts(raw: string): { callouts: { theme: string; text: string }[]; notes: string } {
  const obj = extractJsonObject(unwrap(raw)) as { callouts?: unknown; notes?: unknown };
  if (!Array.isArray(obj.callouts)) throw new Error("callouts is not an array");
  const callouts = obj.callouts
    .map((c) => c as { theme?: unknown; text?: unknown })
    .filter((c) => typeof c.theme === "string" && typeof c.text === "string")
    .map((c) => ({
      theme: (c.theme as string).replace(/\*/g, "").replace(/:\s*$/, "").trim(),
      text: (c.text as string).replace(/^[:\s]+/, "").trim(),
    }))
    .filter((c) => c.theme && c.text);
  if (callouts.length === 0) throw new Error("no callouts returned");
  return { callouts, notes: typeof obj.notes === "string" ? obj.notes.trim() : "" };
}

export function formatCalloutsDraft(callouts: { theme: string; text: string }[]): string {
  return ["Callouts for:", ...callouts.map((c) => `- **${c.theme}**: ${c.text}`)].join("\n");
}

export async function writeWeeklyCallouts(
  input: WriteWeeklyInput,
  deps?: { run?: (prompt: string) => Promise<string> }
): Promise<WeeklyWriterResult> {
  const run =
    deps?.run ?? ((prompt: string) => runClaude(prompt, { model: "sonnet", timeoutMs: TIMEOUT_MS }));
  try {
    const { callouts, notes } = parseCallouts(await run(buildWeeklyPrompt(input)));
    return { draft: formatCalloutsDraft(callouts), ...(notes ? { notes } : {}), usedFallback: false };
  } catch (e) {
    const reason = e instanceof Error ? e.message.split("\n")[0].slice(0, 120) : "unknown error";
    return {
      draft: "Callouts for:\n- **Theme**: ",
      notes: `Could not draft callouts (${reason}); fill them in by hand`,
      usedFallback: true,
    };
  }
}
