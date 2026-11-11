import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildDailyCheckInDraft } from "./checkin-draft.js";
import type {
  CheckInWriterResult,
  MentionRules,
  RosterPersonPublic,
} from "./checkin-types.js";
import type { GranolaNoteForCheckIn } from "./granola-client.js";
import type { Payload } from "./types.js";

export interface WriteCheckInInput {
  date: string;
  payload: Payload;
  meetingNotes: GranolaNoteForCheckIn[];
  roster: RosterPersonPublic[];
  rules: MentionRules;
  recentAnswers: string[];
}

// process.cwd(), not import.meta.url: the server build bundles lib/ into build/server/.
const PROMPT_PATH = path.join(process.cwd(), "config", "checkin-prompt.md");

const TIMEOUT_MS = 90_000;
const MAX_RECENT = 10;

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function linearTitles(items: Array<Record<string, unknown>> | undefined) {
  return (items ?? [])
    .map((i) => ({ title: str(i.title) || str(i.name), project: str(i.project) }))
    .filter((i) => i.title)
    .map((i) => (i.project ? i : { title: i.title }));
}

export function compactPayload(payload: Payload): Record<string, unknown> {
  // Stats only carry a commit total, so list repos touched plus the total.
  const gh = payload.github ?? { merged_prs: [], open_prs: [], reviews: [] };
  const lin = payload.linear ?? {
    completed_issues: [],
    worked_on_issues: [],
  };
  return {
    mergedPrs: gh.merged_prs.map((p) => ({ title: p.title, repo: p.repo })),
    openPrs: gh.open_prs.map((p) => ({ title: p.title, repo: p.repo, state: p.state })),
    reviewedPrs: gh.reviews.map((r) => ({ title: r.title, repo: r.repo ?? null })),
    commits: { total: payload.stats?.commits_pushed ?? 0, repos: payload.stats?.repos ?? [] },
    linearCompleted: linearTitles(lin.completed_issues),
    linearCompletedProjects: linearTitles(lin.completed_projects),
    linearWorkedOn: linearTitles(lin.worked_on_issues),
    linearCreated: linearTitles(lin.created_issues),
  };
}

function weekday(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
}

export function buildPrompt(input: WriteCheckInInput): string {
  const base = readFileSync(PROMPT_PATH, "utf8").trim();
  const meetings = input.meetingNotes.map((n) => ({
    title: (n.title ?? "Meeting").trim() || "Meeting",
    summary: (n.summaryText ?? "").trim().slice(0, 1500),
  }));
  const recent = input.recentAnswers.slice(0, MAX_RECENT);
  return [
    base,
    "",
    `Today is ${weekday(input.date)}, ${input.date}.`,
    "",
    "Work data (JSON):",
    JSON.stringify(compactPayload(input.payload), null, 1),
    "",
    "Granola meetings today (JSON):",
    JSON.stringify(meetings, null, 1),
    "",
    "Taggable roster (full names):",
    input.roster.map((p) => `- ${p.name}`).join("\n") || "(none)",
    "",
    "Ambiguous first names (use the full name or no @):",
    input.rules.ambiguous.map((n) => `- ${n}`).join("\n") || "(none)",
    "",
    "Plain names (never use @):",
    input.rules.plain.map((n) => `- ${n}`).join("\n") || "(none)",
    "",
    "Recent answers (tone examples only, do not copy content):",
    recent.length
      ? recent.map((a, i) => `Example ${i + 1}:\n${a}`).join("\n\n")
      : "(none)",
    "",
    "Reply with ONLY the JSON object.",
  ].join("\n");
}

/** Runs headless Claude Code with only the read-only Slack search tool. */
export function runClaude(
  prompt: string,
  opts: { model: string; timeoutMs: number }
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "claude",
      [
        "-p",
        "--model",
        opts.model,
        "--allowedTools",
        "mcp__claude_ai_Slack__slack_search_public_and_private",
        "--output-format",
        "json",
      ],
      { timeout: opts.timeoutMs, maxBuffer: 10 * 1024 * 1024, cwd: os.tmpdir() },
      (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout);
      }
    );
    child.stdin?.on("error", () => {});
    child.stdin?.end(prompt);
  });
}

const defaultRun = (prompt: string) =>
  runClaude(prompt, { model: "haiku", timeoutMs: TIMEOUT_MS });

export function extractJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  if (start === -1) throw new Error("no JSON object in output");
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error("unterminated JSON object");
}

/** Accepts the CLI envelope ({result: "..."}) or the bare model text. */
export function unwrap(raw: string): string {
  try {
    const env = JSON.parse(raw) as { result?: unknown; is_error?: boolean };
    if (env && typeof env === "object" && "result" in env) {
      if (env.is_error) throw new Error("claude reported an error");
      if (typeof env.result === "string") return env.result;
    }
  } catch (e) {
    if (e instanceof Error && e.message === "claude reported an error") throw e;
  }
  return raw;
}

function parseResult(raw: string): { bullets: string[]; notes: string } {
  const obj = extractJsonObject(unwrap(raw)) as {
    bullets?: unknown;
    notes?: unknown;
  };
  if (!Array.isArray(obj.bullets)) throw new Error("bullets is not an array");
  const bullets = obj.bullets
    .filter((b): b is string => typeof b === "string")
    .map((b) => b.trim().replace(/^[-*]\s+/, "").trim())
    .filter(Boolean);
  if (bullets.length === 0) throw new Error("no bullets returned");
  return { bullets, notes: typeof obj.notes === "string" ? obj.notes.trim() : "" };
}

export async function writeCheckInDraft(
  input: WriteCheckInInput,
  deps?: { run?: (prompt: string) => Promise<string> }
): Promise<CheckInWriterResult> {
  try {
    const run = deps?.run ?? defaultRun;
    const raw = await run(buildPrompt(input));
    const { bullets, notes } = parseResult(raw);
    return {
      draft: bullets.map((b) => `- ${b}`).join("\n"),
      ...(notes ? { notes } : {}),
      usedFallback: false,
    };
  } catch (e) {
    const reason = e instanceof Error ? e.message.split("\n")[0].slice(0, 120) : "unknown error";
    let draft = "";
    try {
      draft = buildDailyCheckInDraft(input.date, input.payload, input.meetingNotes);
    } catch {
      draft = "";
    }
    return {
      draft,
      notes: `${reason}; showing the basic draft instead`,
      usedFallback: true,
    };
  }
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, g: string) => {
    if (g[0] === "#") {
      const code = g[1].toLowerCase() === "x" ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[g.toLowerCase()] ?? m;
  });
}

/** Turns a stored Basecamp answer's HTML into "- line" text. */
export function answerHtmlToText(html: string): string {
  let s = html;
  // Mentions: keep the figcaption text as "@Name".
  s = s.replace(
    /<bc-attachment\b[^>]*content-type="application\/vnd\.basecamp\.mention"[^>]*>([\s\S]*?)<\/bc-attachment>/gi,
    (_m, inner: string) => {
      const cap = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(inner);
      const name = cap ? cap[1].replace(/<[^>]+>/g, "").trim() : "";
      return name ? `@${name}` : "";
    }
  );
  // Remaining attachments (images) are dropped.
  s = s.replace(/<bc-attachment\b[^>]*>[\s\S]*?<\/bc-attachment>/gi, "");
  s = s.replace(/<bc-attachment\b[^>]*\/>/gi, "");
  s = s.replace(/<li[^>]*>/gi, "\n- ");
  s = s.replace(/<br\s*\/?>|<\/(p|div|ul|ol|li)>/gi, "\n");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeEntities(s);
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter((l) => l && l !== "-")
    .join("\n");
}

/** Like answerHtmlToText, for answers already run through basecamp-fetch's sanitizer (images become wrapped spans). */
export function sanitizedAnswerToText(html: string): string {
  return answerHtmlToText(
    html.replace(/<span class="bc-image-wrapper">[\s\S]*?<\/span><\/span>/g, "")
  );
}
