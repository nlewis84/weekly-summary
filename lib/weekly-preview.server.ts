import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fetchMyRecentCheckIns } from "./basecamp-fetch.js";
import {
  attachFileToBasecamp,
  getWeeklyQuestionId,
  upsertHtmlCheckIn,
} from "./basecamp-post.js";
import { loadMentionRules, loadRoster, toPublicRoster } from "./basecamp-roster.js";
import { buildWeeklyCalloutsHtml } from "./checkin-mentions.js";
import type { WeeklyBasecampPreview } from "./checkin-types.js";
import { sanitizedAnswerToText } from "./checkin-writer.js";
import { getBasecampAnswerId, setBasecampAnswerId } from "./daily-snapshot.js";
import { fetchGranolaNotesForWindow, isGranolaConfigured } from "./granola-client.js";
import type { Payload } from "./types.js";
import { captureWeeklyScreenshots } from "./weekly-screenshots.js";
import { weekDates, writeWeeklyCallouts } from "./weekly-callouts-writer.js";

const WEEK_ENDING = /^\d{4}-\d{2}-\d{2}$/;
const answerKey = (weekEnding: string) => `weekly:${weekEnding}`;
const shotsDir = (weekEnding: string) =>
  path.join(process.cwd(), ".cache", "weekly-shots", weekEnding);

async function loadDailiesForWeek(weekEnding: string) {
  const { monday } = weekDates(weekEnding);
  try {
    const answers = await fetchMyRecentCheckIns({ limit: 15, kind: "daily" });
    return answers
      .filter((a) => a.date >= monday && a.date <= weekEnding)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((a) => ({ date: a.date, text: sanitizedAnswerToText(a.content) }));
  } catch (err) {
    console.error("Could not load this week's daily check-ins:", err);
    return [];
  }
}

export async function buildWeeklyBasecampPreview(
  payload: Payload,
  origin: string,
  cookieHeader = ""
): Promise<WeeklyBasecampPreview> {
  const weekEnding = payload.meta.week_ending;
  const notes: string[] = [];

  const [roster, dailies, granola] = await Promise.all([
    loadRoster().catch((err) => {
      console.error("Could not load Basecamp roster:", err);
      notes.push("Could not load Basecamp people, so no one will be tagged.");
      return [];
    }),
    loadDailiesForWeek(weekEnding),
    isGranolaConfigured()
      ? fetchGranolaNotesForWindow(payload.meta.window_start, payload.meta.window_end)
      : Promise.resolve({ notes: [], warning: undefined }),
  ]);
  const rules = loadMentionRules();
  const publicRoster = toPublicRoster(roster);

  const [written, shots] = await Promise.all([
    writeWeeklyCallouts({
      weekEnding,
      payload,
      dailies,
      meetingNotes: granola.notes,
      roster: publicRoster,
      rules,
    }),
    captureWeeklyScreenshots(origin, weekEnding, cookieHeader),
  ]);

  if (written.notes) notes.push(written.notes);
  if (granola.warning) notes.push(`Granola: ${granola.warning}`);
  if (shots.error) notes.push(`Screenshots: ${shots.error}`);

  return {
    weekEnding,
    draft: written.draft,
    notes: notes.join(" ") || undefined,
    usedFallback: written.usedFallback,
    roster: publicRoster,
    mentionRules: rules,
    screenshots: shots.files.map((f) => ({
      name: f.name,
      dataUrl: `data:image/png;base64,${readFileSync(f.path).toString("base64")}`,
    })),
  };
}

export async function postWeeklyCallouts(
  weekEnding: string,
  body: string
): Promise<{ ok: boolean; error?: string; appUrl?: string; warning?: string }> {
  if (!WEEK_ENDING.test(weekEnding)) return { ok: false, error: "Invalid weekEnding" };
  const questionId = getWeeklyQuestionId();
  if (!questionId) return { ok: false, error: "BASECAMP_WEEKLY_QUESTION_ID is not set" };

  let files: string[] = [];
  try {
    // Names are macOS-style timestamps one second apart, so sorting keeps capture order.
    files = readdirSync(shotsDir(weekEnding))
      .filter((f) => f.endsWith(".png"))
      .sort()
      .map((f) => path.join(shotsDir(weekEnding), f));
  } catch {
    files = [];
  }

  const imageSgids: string[] = [];
  const failed: string[] = [];
  for (const file of files) {
    const res = await attachFileToBasecamp(file);
    if (res.ok) imageSgids.push(res.sgid);
    else failed.push(res.error);
  }

  const roster = await loadRoster().catch(() => []);
  const html = buildWeeklyCalloutsHtml(body, roster, loadMentionRules(), imageSgids);
  const result = await upsertHtmlCheckIn(
    weekEnding,
    html,
    getBasecampAnswerId(answerKey(weekEnding)),
    questionId
  );
  if (!result.ok) return { ok: false, error: result.error };
  if (result.answerId) setBasecampAnswerId(answerKey(weekEnding), result.answerId);

  const warning =
    files.length === 0
      ? "posted without screenshots (none were captured)"
      : failed.length
        ? `posted without ${failed.length} screenshot(s): ${failed[0]}`
        : undefined;
  return { ok: true, appUrl: result.appUrl, warning };
}
