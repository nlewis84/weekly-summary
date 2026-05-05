import { describe, expect, it } from "vitest";
import { buildDailyCheckInDraft } from "./checkin-draft";
import { formatSnapshotAsCheckIn } from "./daily-snapshot";
import type { Payload } from "./types";

function minimalPayload(overrides?: Partial<Payload>): Payload {
  return {
    meta: {
      generated_at: "2026-05-05T12:00:00Z",
      window_start: "2026-05-05T06:00:00.000Z",
      window_end: "2026-05-06T05:59:59.999Z",
      week_ending: "2026-05-08",
    },
    stats: {
      prs_merged: 0,
      prs_total: 0,
      pr_reviews: 0,
      pr_comments: 0,
      commits_pushed: 0,
      linear_completed: 0,
      linear_worked_on: 0,
      linear_issues_created: 0,
      linear_comments: 0,
      repos: [],
    },
    linear: { completed_issues: [], worked_on_issues: [] },
    github: { merged_prs: [], open_prs: [], reviews: [] },
    check_ins: [],
    terminal_output: "",
    formatted_output: null,
    ...overrides,
  };
}

describe("buildDailyCheckInDraft", () => {
  it("matches snapshot-only formatting when no meetings", () => {
    const p = minimalPayload();
    const date = "2026-05-05";
    expect(buildDailyCheckInDraft(date, p)).toBe(formatSnapshotAsCheckIn(date, p));
  });

  it("appends Meetings section for one note", () => {
    const p = minimalPayload();
    const draft = buildDailyCheckInDraft("2026-05-05", p, [
      {
        id: "not_abc",
        title: "Standup",
        summaryText: "Discussed Q2 goals.",
      },
    ]);
    expect(draft).toContain("Meetings");
    expect(draft).toContain("- Standup: Discussed Q2 goals.");
  });

  it("handles null title and long summary truncation", () => {
    const p = minimalPayload();
    const long = "x".repeat(600);
    const draft = buildDailyCheckInDraft("2026-05-05", p, [
      { id: "not_1", title: null, summaryText: long },
    ]);
    expect(draft).toContain("- Meeting:");
    const meetingLine = draft.split("\n").find((l) => l.startsWith("- Meeting"));
    expect(meetingLine).toBeDefined();
    expect(meetingLine!.length).toBeLessThan(600);
    expect(meetingLine!.endsWith("…")).toBe(true);
  });

  it("supports two notes", () => {
    const p = minimalPayload();
    const draft = buildDailyCheckInDraft("2026-05-05", p, [
      { id: "a", title: "A", summaryText: "one" },
      { id: "b", title: "B", summaryText: "two" },
    ]);
    expect(draft).toContain("- A: one");
    expect(draft).toContain("- B: two");
  });
});
