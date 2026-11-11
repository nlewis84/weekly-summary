import { describe, expect, it } from "vitest";
import { buildWeeklyCalloutsHtml } from "./checkin-mentions";
import type { MentionRules, RosterPerson } from "./checkin-types";
import type { Payload } from "./types";
import { buildWeeklyPrompt, weekDates, writeWeeklyCallouts } from "./weekly-callouts-writer";

const roster: RosterPerson[] = [
  { id: 1, name: "Conrad VanLandingham", firstName: "Conrad", avatarUrl: "", sgid: "SGID-C" },
  { id: 2, name: "Nathan Lewis", firstName: "Nathan", avatarUrl: "", sgid: "SGID-N" },
];
const rules: MentionRules = { plain: ["Fowler", "Michael", "Heather F."], ambiguous: ["Heather", "Tyler"] };
const payload = {
  meta: { week_ending: "2026-11-13" },
  github: { merged_prs: [{ title: "Lock unpaid weeks", repo: "apollos-admin", url: "https://github.com/x/pull/1" }], open_prs: [], reviews: [] },
  linear: { completed_issues: [], worked_on_issues: [] },
  stats: { commits_pushed: 3, repos: ["apollos-admin"] },
} as unknown as Payload;
const input = { weekEnding: "2026-11-13", payload, dailies: [{ date: "2026-11-10", text: "- PR Reviews" }], meetingNotes: [], roster, rules };

describe("writeWeeklyCallouts", () => {
  it("formats the model's callouts as editable text", async () => {
    const run = async () =>
      JSON.stringify({
        result: '```json\n{"callouts":[{"theme":"**FreedUp paid access:**","text":"Shipped locks w/ @Conrad"}],"notes":""}\n```',
      });
    const out = await writeWeeklyCallouts(input, { run });
    expect(out.usedFallback).toBe(false);
    expect(out.draft).toBe("Callouts for:\n- **FreedUp paid access**: Shipped locks w/ @Conrad");
  });

  it("falls back to an empty template when the run fails", async () => {
    const out = await writeWeeklyCallouts(input, { run: async () => Promise.reject(new Error("timeout")) });
    expect(out.usedFallback).toBe(true);
    expect(out.draft.startsWith("Callouts for:")).toBe(true);
    expect(out.notes).toContain("timeout");
  });

  it("puts the week's dates, dailies and roster in the prompt, without Nathan or URLs", () => {
    const prompt = buildWeeklyPrompt(input);
    expect(weekDates("2026-11-13")).toEqual({ monday: "2026-11-09", sunday: "2026-11-08", saturday: "2026-11-14" });
    expect(prompt).toContain("after:2026-11-08 before:2026-11-14");
    expect(prompt).toContain("2026-11-10 (Tuesday):\n- PR Reviews");
    expect(prompt).toContain("Conrad VanLandingham");
    expect(prompt).not.toContain("Nathan Lewis");
    expect(prompt).not.toContain("github.com");
  });
});

describe("buildWeeklyCalloutsHtml", () => {
  const body = [
    "**🏝️ OOO Friday**",
    "Callouts for:",
    "- **FreedUp paid access**: Shipped locks w/ @Conrad",
    "- **Crash reports**: Closed 14 <noisy> reports w/ Fowler",
  ].join("\n");

  it("matches Nathan's weekly HTML: bold OOO line, highlighted themes, tags, images", () => {
    const html = buildWeeklyCalloutsHtml(body, roster, rules, ["IMG1", "IMG2"], () => 0);
    expect(html).toBe(
      "<p><strong>🏝️ OOO Friday</strong></p>" +
        "<p>Callouts for:</p><ul>" +
        '<li><mark style="color: var(--highlight-2);background-color: var(--highlight-bg-2);"><strong>FreedUp paid access</strong></mark><strong>:</strong> Shipped locks w/ <bc-attachment sgid="SGID-C" content-type="application/vnd.basecamp.mention"></bc-attachment></li>' +
        '<li><mark style="color: var(--highlight-3);background-color: var(--highlight-bg-3);"><strong>Crash reports</strong></mark><strong>:</strong> Closed 14 &lt;noisy&gt; reports w/ Fowler</li>' +
        '</ul><bc-attachment sgid="IMG1"></bc-attachment><p><br></p><bc-attachment sgid="IMG2"></bc-attachment>'
    );
  });

  it("gives each callout a different highlight color", () => {
    const many = ["Callouts for:", ...Array.from({ length: 4 }, (_, i) => `- **T${i}**: x`)].join("\n");
    const colors = [...buildWeeklyCalloutsHtml(many, roster, rules).matchAll(/--highlight-(\d)\)/g)].map((m) => m[1]);
    expect(new Set(colors).size).toBe(4);
  });
});
