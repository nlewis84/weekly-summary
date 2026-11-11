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

export function getWeeklyQuestionId(): string | null {
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
  data?: unknown;
}

/**
 * The CLI reports failures as JSON on stdout *and* exits non-zero, which makes
 * execFile throw. Reading only `err.message` there threw the useful half away:
 * a rejected post surfaced as Node's "Command failed: basecamp checkins answer
 * create ..." with the entire body echoed back, instead of the API's actual
 * complaint (an oversized answer comes back as "Unprocessable Entity").
 */
function parseBasecampOutput(stdout: unknown): BasecampResult | null {
  if (typeof stdout !== "string" || !stdout.trim()) return null;
  try {
    const parsed = JSON.parse(stdout) as {
      ok?: boolean;
      error?: string;
      code?: string;
      data?: unknown;
    };
    if (parsed.ok === false) {
      const detail = [parsed.error, parsed.code && `(${parsed.code})`]
        .filter(Boolean)
        .join(" ");
      return { ok: false, error: detail || "basecamp CLI reported a failure" };
    }
    return { ok: true, data: parsed.data };
  } catch {
    return null;
  }
}

async function runBasecamp(args: string[]): Promise<BasecampResult> {
  try {
    const { stdout } = await execFileAsync("basecamp", args, {
      timeout: 30_000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return parseBasecampOutput(stdout) ?? { ok: true };
  } catch (err) {
    const fromCli = parseBasecampOutput(
      (err as { stdout?: unknown } | null)?.stdout
    );
    if (fromCli) {
      console.error("Basecamp CLI error:", fromCli.error);
      return fromCli;
    }
    // Nothing parseable — fall back to the thrown message, trimmed so a large
    // body echoed into it cannot become the error the user sees.
    const raw =
      err instanceof Error ? err.message : "Unknown basecamp CLI error";
    const msg = raw.length > 300 ? `${raw.slice(0, 300)}…` : raw;
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

/** Uploads a file and returns the sgid used to embed it in rich text. */
export async function attachFileToBasecamp(
  filePath: string
): Promise<{ ok: true; sgid: string } | { ok: false; error: string }> {
  const result = await runBasecamp(["attach", filePath, "--json"]);
  if (!result.ok) return { ok: false, error: result.error ?? "attach failed" };
  const first = Array.isArray(result.data)
    ? (result.data[0] as { attachable_sgid?: string } | undefined)
    : undefined;
  if (!first?.attachable_sgid) {
    return { ok: false, error: "basecamp attach returned no sgid" };
  }
  return { ok: true, sgid: first.attachable_sgid };
}

/**
 * Posts an HTML check-in answer, or replaces the one already posted for this
 * date. The CLI skips its markdown conversion once the body holds any HTML, so
 * callers pass finished HTML (see buildCheckInHtml). An update that fails (for
 * example, the earlier answer was trashed) falls back to a new answer.
 */
export async function upsertHtmlCheckIn(
  date: string,
  html: string,
  existingAnswerId?: number,
  questionId: string = getCheckInQuestionId()
): Promise<BasecampResult & { answerId?: number; appUrl?: string }> {
  const projectId = getProjectId();

  const read = (r: BasecampResult) => {
    const d = r.data as { id?: number; app_url?: string } | undefined;
    return { ...r, answerId: d?.id, appUrl: d?.app_url };
  };

  const existing = existingAnswerId
    ? await runBasecamp([
        "checkins",
        "answer",
        "show",
        String(existingAnswerId),
        "--in",
        projectId,
        "--json",
      ])
    : null;
  const existingIsLive =
    existing?.ok &&
    (existing.data as { status?: string } | undefined)?.status === "active";

  if (existingAnswerId && existingIsLive) {
    const updated = await runBasecamp([
      "checkins",
      "answer",
      "update",
      String(existingAnswerId),
      "--in",
      projectId,
      "--json",
      "--",
      html,
    ]);
    if (updated.ok) return read(updated);
    console.error(
      `Updating Basecamp answer ${existingAnswerId} failed (${updated.error}); posting a new one`
    );
  }

  return read(
    await runBasecamp([
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
      html,
    ])
  );
}
