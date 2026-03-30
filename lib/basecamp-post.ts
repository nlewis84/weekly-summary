import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

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

  return runBasecamp([
    "checkins",
    "answer",
    "create",
    questionId,
    content,
    "--in",
    projectId,
    "--date",
    date,
    "--json",
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
      markdown,
      "--in",
      projectId,
      "--json",
    ]);
  }

  return runBasecamp([
    "message",
    `Weekly Summary — ${weekEnding}`,
    markdown,
    "--in",
    projectId,
    "--no-subscribe",
    "--json",
  ]);
}
