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

async function runBasecampJson<T>(args: string[]): Promise<T> {
  const { stdout } = await execFileAsync("basecamp", args, {
    timeout: 30_000,
    maxBuffer: 5 * 1024 * 1024,
  });
  return JSON.parse(stdout) as T;
}

async function getMyEmail(): Promise<string> {
  if (cachedEmail) return cachedEmail;
  const result = await runBasecampJson<{
    ok: boolean;
    data: { identity: { email_address: string } };
  }>(["me", "--json"]);
  cachedEmail = result.data.identity.email_address;
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
  const myEmail = await getMyEmail();

  const result = await runBasecampJson<{
    ok: boolean;
    data: BasecampAnswerRaw[];
  }>([
    "checkins",
    "answers",
    questionId,
    "--in",
    projectId,
    "--limit",
    String(limit),
    "--json",
  ]);

  if (!result.ok || !Array.isArray(result.data)) return [];

  return result.data
    .filter((a) => a.creator.email_address === myEmail)
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

export async function fetchMyRecentCheckIns(
  options: { limit?: number } = {}
): Promise<CheckInAnswer[]> {
  const limit = options.limit ?? 50;
  const dailyId = process.env.BASECAMP_CHECKIN_QUESTION_ID;
  const weeklyId = process.env.BASECAMP_WEEKLY_QUESTION_ID;

  const fetches: Promise<CheckInAnswer[]>[] = [];

  if (dailyId) {
    fetches.push(fetchMyCheckInAnswers(dailyId, "daily", limit));
  }
  if (weeklyId) {
    fetches.push(fetchMyCheckInAnswers(weeklyId, "weekly", limit));
  }

  const results = await Promise.all(fetches);
  const merged = results.flat();
  merged.sort((a, b) => b.date.localeCompare(a.date));
  return merged;
}
