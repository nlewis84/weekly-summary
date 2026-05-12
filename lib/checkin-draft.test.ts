import { describe, expect, it } from "vitest";
import {
  buildDailyCheckInDraft,
  extractTopLevelBullets,
  softCap,
} from "./checkin-draft";
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

function note(
  partial: Partial<{
    id: string;
    title: string | null;
    summaryText: string;
    summaryMarkdown: string | null;
  }>
) {
  return {
    id: partial.id ?? "not_1",
    title: partial.title ?? "Meeting",
    summaryText: partial.summaryText ?? "",
    summaryMarkdown:
      partial.summaryMarkdown !== undefined
        ? partial.summaryMarkdown
        : null,
  };
}

describe("buildDailyCheckInDraft", () => {
  it("matches snapshot-only formatting when no meetings", () => {
    const p = minimalPayload();
    const date = "2026-05-05";
    expect(buildDailyCheckInDraft(date, p)).toBe(
      formatSnapshotAsCheckIn(date, p)
    );
  });

  it("appends Meetings section with title and nested summary line", () => {
    const p = minimalPayload();
    const draft = buildDailyCheckInDraft("2026-05-05", p, [
      note({
        id: "not_abc",
        title: "Standup",
        summaryText: "Discussed Q2 goals.",
      }),
    ]);
    expect(draft).toContain("Meetings");
    expect(draft).toContain("- Standup");
    expect(draft).toContain("  - Discussed Q2 goals.");
  });

  it("handles null title and keeps full long line when no sentence boundary", () => {
    const p = minimalPayload();
    const long = "x".repeat(600);
    const draft = buildDailyCheckInDraft("2026-05-05", p, [
      note({ id: "not_1", title: null, summaryText: long }),
    ]);
    expect(draft).toContain("- Meeting\n");
    const meetingsIdx = draft.indexOf("Meetings");
    const afterMeetings = draft.slice(meetingsIdx);
    expect(afterMeetings).not.toContain("…");
    expect(afterMeetings).toContain(long);
  });

  it("supports two notes with nested bullets", () => {
    const p = minimalPayload();
    const draft = buildDailyCheckInDraft("2026-05-05", p, [
      note({ id: "a", title: "A", summaryText: "one" }),
      note({ id: "b", title: "B", summaryText: "two" }),
    ]);
    expect(draft).toContain("- A\n  - one");
    expect(draft).toContain("- B\n  - two");
  });

  it("uses markdown top-level bullets only, not indented sub-bullets", () => {
    const p = minimalPayload();
    const md = `- Parent visible
  - Child hidden
- Second visible`;
    const draft = buildDailyCheckInDraft("2026-05-05", p, [
      note({ title: "Sync", summaryText: "fallback", summaryMarkdown: md }),
    ]);
    const meetingsIdx = draft.indexOf("Meetings");
    const afterMeetings = draft.slice(meetingsIdx);
    expect(afterMeetings).toContain("  - Parent visible");
    expect(afterMeetings).toContain("  - Second visible");
    expect(afterMeetings).not.toContain("Child hidden");
    expect(afterMeetings).not.toContain("…");
  });

  it("falls back to summaryText lines when markdown is empty", () => {
    const p = minimalPayload();
    const draft = buildDailyCheckInDraft("2026-05-05", p, [
      note({
        title: "Call",
        summaryMarkdown: "",
        summaryText: "First line\nSecond line",
      }),
    ]);
    expect(draft).toContain("  - First line");
    expect(draft).toContain("  - Second line");
  });

  it("soft-caps a long bullet at last sentence boundary within 200 chars", () => {
    const p = minimalPayload();
    const prefix = "a".repeat(170);
    const longBullet = `${prefix}. ${"b".repeat(200)}`;
    const md = `- ${longBullet}`;
    const draft = buildDailyCheckInDraft("2026-05-05", p, [
      note({ title: "M", summaryText: "", summaryMarkdown: md }),
    ]);
    const line = draft.split("\n").find((l) => l.startsWith("  - "));
    expect(line).toBeDefined();
    expect(line!.length).toBeLessThanOrEqual(200 + 4);
    expect(line).toMatch(/\.\s*$/);
    expect(line).not.toContain("…");
  });

  it("includes headings as top-level bullets", () => {
    const md = `## Section A
- Bullet under section
### Subheading`;
    expect(extractTopLevelBullets(md, "")).toEqual([
      "Section A",
      "Bullet under section",
      "Subheading",
    ]);
  });
});

describe("softCap", () => {
  it("returns short text unchanged", () => {
    expect(softCap("Hello world.")).toBe("Hello world.");
  });

  it("returns full text when over max with no sentence boundary in window", () => {
    const long = "x".repeat(300);
    expect(softCap(long, 200)).toBe(long);
  });

  it("trims at last sentence end within first max+1 chars", () => {
    const prefix = "w".repeat(170);
    const s = `${prefix}. ${"z".repeat(200)}`;
    const out = softCap(s, 200);
    expect(out).toBe(`${prefix}.`);
    expect(out.length).toBeLessThanOrEqual(200);
  });
});

describe("extractTopLevelBullets", () => {
  it("skips fenced code blocks", () => {
    const md = `- Before
\`\`\`
- fake bullet
\`\`\`
- After`;
    expect(extractTopLevelBullets(md, "")).toEqual(["Before", "After"]);
  });
});
