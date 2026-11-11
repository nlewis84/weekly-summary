import { describe, expect, it } from "vitest";
import {
  answerHtmlToText,
  buildPrompt,
  writeCheckInDraft,
} from "./checkin-writer.js";
import type { Payload } from "./types.js";

const payload = {
  meta: { generated_at: "2026-11-10T21:00:00Z", window_start: "", window_end: "", week_ending: "2026-11-13" },
  stats: { commits_pushed: 5, repos: ["apollos-admin"] },
  linear: {
    completed_issues: [{ identifier: "APO-1", title: "Fix giving note", project: "Unified Giving History" }],
    worked_on_issues: [],
  },
  github: {
    merged_prs: [{ title: "Remove phone requirement", url: "https://github.com/x/y/pull/42", repo: "apollos-admin", merged_at: null }],
    open_prs: [],
    reviews: [{ title: "Add previews", url: "https://github.com/x/y/pull/43", repo: "apollos-admin" }],
  },
  check_ins: [],
  terminal_output: "",
  formatted_output: null,
} as unknown as Payload;

const input = {
  date: "2026-11-10",
  payload,
  meetingNotes: [],
  roster: [
    { id: 1, name: "Dana Smith", firstName: "Dana", avatarUrl: "" },
    { id: 2, name: "Heather Peters", firstName: "Heather", avatarUrl: "" },
  ],
  rules: { plain: ["Fowler", "Heather F."], ambiguous: ["Heather", "Tyler"] },
  recentAnswers: ["- PR Reviews"],
};

const ok = (bullets: string[], notes = "") =>
  JSON.stringify({ result: JSON.stringify({ bullets, notes }) });

describe("writeCheckInDraft", () => {
  it("builds a draft from good JSON", async () => {
    const r = await writeCheckInDraft(input, { run: async () => ok(["PR Reviews", "Jam w/ @Dana"]) });
    expect(r).toEqual({ draft: "- PR Reviews\n- Jam w/ @Dana", usedFallback: false });
  });

  it("handles fenced JSON and keeps notes", async () => {
    const text = 'Here:\n```json\n{"bullets":["A"],"notes":"Slack failed"}\n```';
    const r = await writeCheckInDraft(input, { run: async () => JSON.stringify({ result: text }) });
    expect(r.draft).toBe("- A");
    expect(r.notes).toBe("Slack failed");
  });

  it("strips leading dashes and drops empty bullets", async () => {
    const r = await writeCheckInDraft(input, { run: async () => ok(["- A", "  ", "C"]) });
    expect(r.draft).toBe("- A\n- C");
  });

  it("falls back on bad output", async () => {
    const r = await writeCheckInDraft(input, { run: async () => "not json at all" });
    expect(r.usedFallback).toBe(true);
    expect(r.notes).toContain("showing the basic draft instead");
    expect(r.draft).toContain("Remove phone requirement");
  });

  it("falls back on empty bullets", async () => {
    const r = await writeCheckInDraft(input, { run: async () => ok([]) });
    expect(r.usedFallback).toBe(true);
  });

  it("falls back when run rejects", async () => {
    const r = await writeCheckInDraft(input, { run: async () => { throw new Error("spawn claude ENOENT"); } });
    expect(r.usedFallback).toBe(true);
    expect(r.notes).toContain("ENOENT");
  });

  it("puts names and rules in the prompt, without URLs or ids", () => {
    const p = buildPrompt(input);
    expect(p).toContain("Dana Smith");
    expect(p).toContain("Heather Peters");
    expect(p).toContain("Fowler");
    expect(p).toContain("Heather F.");
    expect(p).toContain("- Tyler");
    expect(p).toContain("Tuesday, 2026-11-10");
    expect(p).toContain("Remove phone requirement");
    expect(p).not.toContain("github.com");
    expect(p).not.toContain("APO-1");
  });
});

describe("answerHtmlToText", () => {
  it("converts list items, mentions, and drops images", () => {
    const html =
      '<div><ul><li>PR Reviews</li><li>Jam w/ <bc-attachment sgid="abc" content-type="application/vnd.basecamp.mention"><figcaption>Dana</figcaption></bc-attachment></li><li>Fish &amp; chips</li></ul>' +
      '<bc-attachment sgid="img" content-type="image/png"><figure><img src="x.png"><figcaption>Screenshot.png</figcaption></figure></bc-attachment></div>';
    expect(answerHtmlToText(html)).toBe("- PR Reviews\n- Jam w/ @Dana\n- Fish & chips");
  });
});
