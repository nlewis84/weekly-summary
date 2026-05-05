import { data } from "react-router";
import type { ActionFunctionArgs } from "react-router";
import { buildDailyCheckInDraft } from "../../lib/checkin-draft";
import { saveDailySnapshot } from "../../lib/daily-snapshot";
import {
  fetchGranolaNotesForWindow,
  isGranolaConfigured,
} from "../../lib/granola-client";
import { isBasecampConfigured, postCheckInToBasecamp } from "../../lib/basecamp-post";
import { getCachedRunSummary } from "../../lib/summary";

const CHECKIN_BODY_MAX_CHARS = 32_000;

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return data({ error: "Method not allowed" }, { status: 405 });
  }

  const formData = await request.formData();
  const mode = (formData.get("mode") as string) ?? "today";
  const isYesterday = mode === "yesterday";
  const postToBasecamp = formData.get("postToBasecamp") === "true";
  const previewBasecamp = formData.get("previewBasecamp") === "true";
  const dateOverride = formData.get("date") as string | null;
  const checkInBodyRaw = formData.get("checkInBody");

  try {
    if (previewBasecamp) {
      const result = await getCachedRunSummary({
        todayMode: !isYesterday,
        yesterdayMode: isYesterday,
        checkInsText: "",
        outputDir: null,
      });

      const snapshotDate =
        dateOverride || result.payload.meta.window_start.slice(0, 10);

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

      const draft = buildDailyCheckInDraft(
        snapshotDate,
        result.payload,
        meetingNotes
      );

      return data({
        ok: true,
        preview: true,
        draft,
        date: snapshotDate,
        granolaWarning,
      });
    }

    const result = await getCachedRunSummary({
      todayMode: !isYesterday,
      yesterdayMode: isYesterday,
      checkInsText: "",
      outputDir: null,
    });

    const snapshotDate =
      dateOverride || result.payload.meta.window_start.slice(0, 10);
    saveDailySnapshot(snapshotDate, result.payload);

    let basecampPosted = false;
    let basecampError: string | undefined;

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
      const bcResult = await postCheckInToBasecamp(snapshotDate, trimmed);
      basecampPosted = bcResult.ok;
      basecampError = bcResult.error;
    }

    return data({
      ok: true,
      date: snapshotDate,
      basecampPosted,
      basecampError,
    });
  } catch (err) {
    console.error("Snapshot capture error:", err);
    return data({ error: (err as Error).message }, { status: 500 });
  }
}
