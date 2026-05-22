import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const LIST_MARKER = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/;
const HEADING_MARKER = /^\s*#{1,6}\s+/;
const BLOCKQUOTE_MARKER = /^\s*>\s?/;
const TRAILING_HARD_BREAK = /(?: {2,}|\\)$/;
const CODE_FENCE = /^\s*(?:```|~~~)/;

/**
 * Basecamp renders check-in answers from Markdown, so a single `\n` between
 * two plain-text lines becomes a soft break (rendered as a space). That
 * collapses a manually-typed multi-line list into one paragraph.
 *
 * Convert single newlines between non-blank lines into Markdown hard breaks
 * (`  \n`) so what the user sees in the textarea matches what Basecamp shows.
 * Skip lines that already have block-level semantics (list items, headings,
 * blockquotes), already end with a hard break, sit inside a fenced code block,
 * or are immediately followed by a blank line (already a paragraph break).
 */
export function preserveLineBreaksForBasecamp(text: string): string {
  const lines = text.split(/\r?\n/);
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (CODE_FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (i === lines.length - 1) continue;

    const next = lines[i + 1];
    if (next === undefined || next.trim() === "") continue;

    const trimmed = line.trim();
    if (!trimmed) continue;

    if (
      LIST_MARKER.test(line) ||
      HEADING_MARKER.test(line) ||
      BLOCKQUOTE_MARKER.test(line) ||
      TRAILING_HARD_BREAK.test(line)
    ) {
      continue;
    }

    lines[i] = line.replace(/[ \t]*$/, "") + "  ";
  }

  return lines.join("\n");
}

function getProjectId(): string {
  const id = process.env.BASECAMP_PROJECT_ID;
  if (!id) throw new Error("BASECAMP_PROJECT_ID is required");
  return id;
}

function getCheckInQuestionId(): string {
  const id = process.env.BASECAMP_CHECKIN_QUESTION_ID;
  if (!id) throw new Error("BASECAMP_CHECKIN_QUESTION_ID is required");
  return id;
}

function getWeeklyQuestionId(): string | null {
  return process.env.BASECAMP_WEEKLY_QUESTION_ID ?? null;
}

export function isBasecampConfigured(): boolean {
  return !!(
    process.env.BASECAMP_PROJECT_ID &&
    process.env.BASECAMP_CHECKIN_QUESTION_ID
  );
}

interface BasecampResult {
  ok: boolean;
  error?: string;
}

async function runBasecamp(args: string[]): Promise<BasecampResult> {
  try {
    const { stdout } = await execFileAsync("basecamp", args, {
      timeout: 30_000,
    });
    const parsed = JSON.parse(stdout) as { ok?: boolean; error?: string };
    return { ok: parsed.ok !== false };
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Unknown basecamp CLI error";
    console.error("Basecamp CLI error:", msg);
    return { ok: false, error: msg };
  }
}

export async function postCheckInToBasecamp(
  date: string,
  content: string
): Promise<BasecampResult> {
  const projectId = getProjectId();
  const questionId = getCheckInQuestionId();
  const body = preserveLineBreaksForBasecamp(content);

  // Flags before body, then `--` so markdown lists (e.g. "- Item") are not parsed as CLI flags.
  return runBasecamp([
    "checkins",
    "answer",
    "create",
    questionId,
    "--in",
    projectId,
    "--date",
    date,
    "--json",
    "--",
    body,
  ]);
}

export async function postWeeklySummaryToBasecamp(
  weekEnding: string,
  markdown: string
): Promise<BasecampResult> {
  const projectId = getProjectId();
  const weeklyQuestionId = getWeeklyQuestionId();

  if (weeklyQuestionId) {
    return runBasecamp([
      "checkins",
      "answer",
      "create",
      weeklyQuestionId,
      "--in",
      projectId,
      "--json",
      "--",
      markdown,
    ]);
  }

  return runBasecamp([
    "message",
    `Weekly Summary — ${weekEnding}`,
    "--in",
    projectId,
    "--no-subscribe",
    "--json",
    "--",
    markdown,
  ]);
}
