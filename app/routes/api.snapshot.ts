import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { fetchMyRecentCheckIns } from "../../lib/basecamp-fetch";
import {
  attachFileToBasecamp,
  isBasecampConfigured,
  upsertHtmlCheckIn,
} from "../../lib/basecamp-post";
import {
  loadMentionRules,
  loadRoster,
  toPublicRoster,
} from "../../lib/basecamp-roster";
import { buildCheckInHtml } from "../../lib/checkin-mentions";
import { sanitizedAnswerToText, writeCheckInDraft } from "../../lib/checkin-writer";
import {
  getBasecampAnswerId,
  localDateString,
  saveDailySnapshot,
  setBasecampAnswerId,
} from "../../lib/daily-snapshot";
import {
  fetchGranolaNotesForWindow,
  isGranolaConfigured,
} from "../../lib/granola-client";
import { getCachedRunSummary } from "../../lib/summary";

const CHECKIN_BODY_MAX_CHARS = 32_000;
const SCREENSHOT_MAX_BYTES = 10 * 1024 * 1024;
const RECENT_ANSWERS_FOR_TONE = 10;

async function loadRecentAnswers(): Promise<string[]> {
  try {
    const answers = await fetchMyRecentCheckIns({
      limit: RECENT_ANSWERS_FOR_TONE,
      kind: "daily",
    });
    return answers.map((a) => sanitizedAnswerToText(a.content)).filter(Boolean);
  } catch (err) {
    console.error("Could not load recent check-ins for tone:", err);
    return [];
  }
}

function screenshotFilename(file: File): string {
  const base = file.name.replace(/[^\w .-]/g, "").trim();
  return base.toLowerCase().endsWith(".png") ? base : "screenshot.png";
}

async function attachScreenshot(
  file: File
): Promise<{ sgid?: string; error?: string }> {
  if (file.type !== "image/png" || file.size > SCREENSHOT_MAX_BYTES) {
    return { error: "Screenshot was not a PNG under 10 MB" };
  }
  const dir = mkdtempSync(join(tmpdir(), "weekly-summary-shot-"));
  try {
    const path = join(dir, screenshotFilename(file));
    writeFileSync(path, Buffer.from(await file.arrayBuffer()));
    const result = await attachFileToBasecamp(path);
    return result.ok ? { sgid: result.sgid } : { error: result.error };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const postToBasecamp = formData.get("postToBasecamp") === "true";
  const previewBasecamp = formData.get("previewBasecamp") === "true";
  const dateOverride = formData.get("date") as string | null;
  const checkInBodyRaw = formData.get("checkInBody");
  const screenshot = formData.get("screenshot");

  try {
    if (previewBasecamp) {
      const [result, roster, recentAnswers] = await Promise.all([
        getCachedRunSummary({
          todayMode: true,
          checkInsText: "",
          outputDir: null,
          forCapture: true,
          bust: true,
        }),
        loadRoster().catch((err) => {
          console.error("Could not load Basecamp roster:", err);
          return [];
        }),
        loadRecentAnswers(),
      ]);
      const rules = loadMentionRules();
      const publicRoster = toPublicRoster(roster);

      const snapshotDate =
        dateOverride || localDateString(result.payload.meta.window_end);

      let granolaWarning: string | undefined;
      let meetingNotes: Awaited<
        ReturnType<typeof fetchGranolaNotesForWindow>
      >["notes"] = [];

      if (isGranolaConfigured()) {
        const gr = await fetchGranolaNotesForWindow(
          result.payload.meta.window_start,
          result.payload.meta.window_end
        );
        meetingNotes = gr.notes;
        granolaWarning = gr.warning;
      }

      const written = await writeCheckInDraft({
        date: snapshotDate,
        payload: result.payload,
        meetingNotes,
        roster: publicRoster,
        rules,
        recentAnswers,
      });

      const rosterNote =
        roster.length === 0
          ? "Could not load Basecamp people, so no one will be tagged."
          : undefined;

      return data({
        ok: true,
        preview: true,
        draft: written.draft,
        date: snapshotDate,
        granolaWarning,
        writerNotes:
          [written.notes, rosterNote].filter(Boolean).join(" ") || undefined,
        roster: publicRoster,
        mentionRules: rules,
      });
    }

    const result = await getCachedRunSummary({
      todayMode: true,
      checkInsText: "",
      outputDir: null,
      forCapture: true,
      bust: true,
    });

    const snapshotDate =
      dateOverride || localDateString(result.payload.meta.window_end);
    saveDailySnapshot(snapshotDate, result.payload);

    let basecampPosted = false;
    let basecampError: string | undefined;
    let basecampUrl: string | undefined;

    if (postToBasecamp && isBasecampConfigured()) {
      const trimmed =
        typeof checkInBodyRaw === "string" ? checkInBodyRaw.trim() : "";
      if (!trimmed) {
        return data(
          {
            error:
              "checkInBody is required when posting to Basecamp. Open the preview and confirm.",
          },
          { status: 400 }
        );
      }
      if (trimmed.length > CHECKIN_BODY_MAX_CHARS) {
        return data(
          {
            error: `Check-in text must be at most ${CHECKIN_BODY_MAX_CHARS} characters.`,
          },
          { status: 400 }
        );
      }

      const [roster, shot] = await Promise.all([
        loadRoster().catch(() => []),
        screenshot instanceof File && screenshot.size > 0
          ? attachScreenshot(screenshot)
          : Promise.resolve<{ sgid?: string; error?: string }>({}),
      ]);

      const html = buildCheckInHtml(
        trimmed,
        roster,
        loadMentionRules(),
        shot.sgid
      );
      const bcResult = await upsertHtmlCheckIn(
        snapshotDate,
        html,
        getBasecampAnswerId(snapshotDate)
      );
      basecampPosted = bcResult.ok;
      basecampUrl = bcResult.appUrl;
      basecampError = bcResult.ok
        ? shot.error && `posted without the screenshot: ${shot.error}`
        : bcResult.error;
      if (bcResult.ok && bcResult.answerId) {
        setBasecampAnswerId(snapshotDate, bcResult.answerId);
      }
    }

    return data({
      ok: true,
      date: snapshotDate,
      basecampPosted,
      basecampError,
      basecampUrl,
    });
  } catch (err) {
    console.error("Snapshot capture error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
