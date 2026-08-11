import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface CheckInAnswer {
  id: number;
  content: string;
  date: string;
  createdAt: string;
  questionTitle: string;
  questionType: "daily" | "weekly";
  appUrl: string;
}

/** Which check-in question feeds to pull. Default is daily-only. */
export type CheckInKind = "daily" | "weekly" | "all";

/**
 * Transform Basecamp-specific HTML into renderable content.
 *
 * Handles two custom element patterns:
 * 1. Mentions (<bc-attachment content-type="application/vnd.basecamp.mention">)
 *    → inline "@Name" span
 * 2. Image attachments (<bc-attachment content-type="image/...">)
 *    → linked thumbnail with filename
 */
function sanitizeBasecampHtml(html: string): string {
  let out = html;

  // Mentions: replace entire bc-attachment block with inline @Name
  out = out.replace(
    /<bc-attachment[^>]*content-type="application\/vnd\.basecamp\.mention"[^>]*>[\s\S]*?<figcaption>\s*([\s\S]*?)\s*<\/figcaption>[\s\S]*?<\/bc-attachment>/g,
    (_match, name: string) => {
      const trimmed = name.trim();
      return `<strong class="bc-mention">@${trimmed}</strong>`;
    }
  );

  // Image attachments: proxy via storage href (the CLI can download these)
  out = out.replace(
    /<bc-attachment[^>]*content-type="image\/[^"]*"[^>]*href="([^"]*)"[^>]*filename="([^"]*)"[^>]*>[\s\S]*?<\/bc-attachment>/g,
    (_match, _href: string, filename: string) => {
      const proxied = `/api/basecamp-image?url=${encodeURIComponent(_href)}`;
      return `<span class="bc-image-wrapper"><img src="${proxied}" alt="${filename}" class="bc-image" loading="lazy" /><span class="bc-image-caption">${filename}</span></span>`;
    }
  );

  // Catch any remaining bc-attachment blocks (e.g. files) and strip them
  out = out.replace(
    /<bc-attachment[^>]*>[\s\S]*?<\/bc-attachment>/g,
    ""
  );

  // Clean up leftover &nbsp; that Basecamp puts after mentions
  out = out.replace(/&nbsp;/g, " ");

  return out;
}

interface BasecampAnswerRaw {
  id: number;
  content: string;
  group_on: string;
  created_at: string;
  app_url: string;
  creator: { email_address: string; name: string };
  parent?: { title: string };
}

let cachedEmail: string | null = null;

interface BasecampCliError {
  ok?: boolean;
  error?: string;
  code?: string;
}

function formatBasecampCliFailure(
  args: string[],
  err: unknown,
  parsed?: BasecampCliError | null
): Error {
  const detail =
    parsed?.error ||
    (parsed?.code ? `code ${parsed.code}` : null) ||
    (err instanceof Error ? err.message : "Unknown basecamp CLI error");
  return new Error(
    `Basecamp CLI failed (${args.join(" ")}): ${detail}. Try refreshing in a moment.`
  );
}

function parseJsonStdout(stdout: unknown): BasecampCliError | null {
  if (typeof stdout !== "string" || !stdout.trim()) return null;
  try {
    return JSON.parse(stdout) as BasecampCliError;
  } catch {
    return null;
  }
}

async function runBasecampJson<T>(args: string[]): Promise<T> {
  try {
    const { stdout } = await execFileAsync("basecamp", args, {
      timeout: 30_000,
      maxBuffer: 100 * 1024 * 1024,
    });
    const parsed = JSON.parse(stdout) as T & BasecampCliError;
    if (parsed && typeof parsed === "object" && parsed.ok === false) {
      throw formatBasecampCliFailure(args, null, parsed);
    }
    return parsed;
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Basecamp CLI failed")) {
      throw err;
    }
    const stdout =
      err && typeof err === "object" && "stdout" in err
        ? (err as { stdout?: unknown }).stdout
        : undefined;
    throw formatBasecampCliFailure(args, err, parseJsonStdout(stdout));
  }
}

async function getMyEmail(): Promise<string> {
  if (cachedEmail) return cachedEmail;
  const result = await runBasecampJson<{
    ok: boolean;
    data: { identity: { email_address: string } };
  }>(["me", "--json"]);
  const email = result.data?.identity?.email_address;
  if (!email) {
    throw new Error("Basecamp CLI did not return your email address");
  }
  cachedEmail = email;
  return cachedEmail;
}

function getProjectId(): string {
  const id = process.env.BASECAMP_PROJECT_ID;
  if (!id) throw new Error("BASECAMP_PROJECT_ID is required");
  return id;
}

export async function fetchMyCheckInAnswers(
  questionId: string,
  questionType: "daily" | "weekly",
  limit = 50
): Promise<CheckInAnswer[]> {
  const projectId = getProjectId();

  // Fetch ALL answers (the question is answered by the whole team) and filter
  // to our own afterwards. Applying the limit at the API level would cap the
  // combined team feed before filtering, leaving only a couple weeks of our
  // own answers visible. `limit` therefore caps *our* answers, post-filter.
  //
  // Resolve our email concurrently with the (slow, multi-MB) answer fetch —
  // they're independent, so there's no reason to serialize them.
  const [myEmail, result] = await Promise.all([
    getMyEmail(),
    runBasecampJson<{
      ok: boolean;
      data: BasecampAnswerRaw[];
    }>([
      "checkins",
      "answers",
      questionId,
      "--in",
      projectId,
      "--all",
      "--json",
    ]),
  ]);

  if (!result.ok || !Array.isArray(result.data)) return [];

  return result.data
    .filter((a) => a.creator.email_address === myEmail)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map((a) => ({
      id: a.id,
      content: sanitizeBasecampHtml(a.content),
      date: a.group_on,
      createdAt: a.created_at,
      questionTitle: a.parent?.title ?? "Check-in",
      questionType,
      appUrl: a.app_url,
    }));
}

// Check-in answers change at most a few times a day, but the underlying CLI
// call pulls several MB and takes ~7s. Cache the merged result briefly so
// navigating to the route repeatedly doesn't re-pay that cost each time.
const CHECKIN_CACHE_TTL_MS = 5 * 60 * 1000;
const checkInCache = new Map<
  string,
  { at: number; promise: Promise<CheckInAnswer[]> }
>();

async function fetchMyRecentCheckInsUncached(
  limit: number,
  kind: CheckInKind
): Promise<CheckInAnswer[]> {
  const dailyId = process.env.BASECAMP_CHECKIN_QUESTION_ID;
  const weeklyId = process.env.BASECAMP_WEEKLY_QUESTION_ID;

  const fetches: Promise<CheckInAnswer[]>[] = [];

  if ((kind === "daily" || kind === "all") && dailyId) {
    fetches.push(fetchMyCheckInAnswers(dailyId, "daily", limit));
  }
  if ((kind === "weekly" || kind === "all") && weeklyId) {
    fetches.push(fetchMyCheckInAnswers(weeklyId, "weekly", limit));
  }

  const results = await Promise.all(fetches);
  const merged = results.flat();
  merged.sort((a, b) => b.date.localeCompare(a.date));
  return merged;
}

export async function fetchMyRecentCheckIns(
  options: { limit?: number; kind?: CheckInKind } = {}
): Promise<CheckInAnswer[]> {
  const limit = options.limit ?? 50;
  const kind = options.kind ?? "daily";
  const key = `${kind}:${limit}`;

  const cached = checkInCache.get(key);
  if (cached && Date.now() - cached.at < CHECKIN_CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = fetchMyRecentCheckInsUncached(limit, kind);
  checkInCache.set(key, { at: Date.now(), promise });

  // If the fetch fails, drop it from the cache so the next load retries
  // instead of serving a rejected promise for the whole TTL window.
  promise.catch(() => {
    if (checkInCache.get(key)?.promise === promise) {
      checkInCache.delete(key);
    }
  });

  return promise;
}
