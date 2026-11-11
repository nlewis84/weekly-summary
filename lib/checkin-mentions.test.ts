import { describe, expect, it } from "vitest";
import {
  buildCheckInHtml,
  tokenizeMentions,
  unresolvedMentions,
} from "./checkin-mentions.js";
import type {
  MentionRules,
  RosterPerson,
  RosterPersonPublic,
} from "./checkin-types.js";

const rules: MentionRules = {
  plain: ["Fowler", "Michael", "Heather F."],
  ambiguous: ["Heather", "Tyler"],
};

const roster: RosterPerson[] = [
  {
    id: 1,
    name: "Heather Peters",
    firstName: "Heather",
    avatarUrl: "https://example.test/hp.png",
    sgid: "SGID-HP",
  },
  {
    id: 2,
    name: "Tyler Siegrist",
    firstName: "Tyler",
    avatarUrl: "https://example.test/ts.png",
    sgid: "SGID-TS",
  },
  {
    id: 3,
    name: "Tyler Vance",
    firstName: "Tyler",
    avatarUrl: "https://example.test/tv.png",
    sgid: "SGID-TV",
  },
  {
    id: 4,
    name: "Vincent Ruiz",
    firstName: "Vincent",
    avatarUrl: "https://example.test/vr.png",
    sgid: "SGID-VR",
  },
];
const publicRoster: RosterPersonPublic[] = roster.map(
  ({ id, name, firstName, avatarUrl }) => ({ id, name, firstName, avatarUrl })
);

describe("tokenizeMentions", () => {
  it("tags a unique first name", () => {
    const tokens = tokenizeMentions("Thanks @Vincent!", publicRoster, rules);
    expect(tokens).toEqual([
      { kind: "text", text: "Thanks " },
      { kind: "person", raw: "@Vincent", person: publicRoster[3] },
      { kind: "text", text: "!" },
    ]);
  });

  it("treats a first name shared in the roster as ambiguous even with one match", () => {
    const tokens = tokenizeMentions("@Heather", publicRoster, rules);
    expect(tokens).toEqual([
      {
        kind: "unresolved",
        raw: "@Heather",
        text: "Heather",
        reason: "ambiguous",
        candidates: ["Heather Peters"],
      },
    ]);
  });

  it("tags a full name, including an ambiguous first name", () => {
    const tokens = tokenizeMentions("cc @Heather Peters", publicRoster, rules);
    expect(tokens[1]).toEqual({
      kind: "person",
      raw: "@Heather Peters",
      person: publicRoster[0],
    });
  });

  it("drops the @ from plain entries, including the period in Heather F.", () => {
    const tokens = tokenizeMentions(
      "@Heather F. and @Fowler's review",
      publicRoster,
      rules
    );
    expect(tokens[0]).toEqual({
      kind: "plain",
      raw: "@Heather F.",
      text: "Heather F.",
    });
    expect(tokens[2]).toEqual({ kind: "plain", raw: "@Fowler", text: "Fowler" });
    expect(tokens[3]).toEqual({ kind: "text", text: "'s review" });
  });

  it("lists both candidates for an ambiguous Tyler", () => {
    const tokens = tokenizeMentions("@Tyler", publicRoster, rules);
    expect(tokens).toEqual([
      {
        kind: "unresolved",
        raw: "@Tyler",
        text: "Tyler",
        reason: "ambiguous",
        candidates: ["Tyler Siegrist", "Tyler Vance"],
      },
    ]);
  });

  it("marks an unknown name unresolved with no candidates", () => {
    const tokens = tokenizeMentions("ping @Zed", publicRoster, rules);
    expect(tokens[1]).toEqual({
      kind: "unresolved",
      raw: "@Zed",
      text: "Zed",
      reason: "unknown",
      candidates: [],
    });
  });

  it("does not treat an email address as a mention", () => {
    const tokens = tokenizeMentions("mail a@Vincent.com", publicRoster, rules);
    expect(tokens).toEqual([{ kind: "text", text: "mail a@Vincent.com" }]);
  });

  it("keeps the possessive outside the mention", () => {
    const tokens = tokenizeMentions("@Vincent's PR", publicRoster, rules);
    expect(tokens[0]).toEqual({
      kind: "person",
      raw: "@Vincent",
      person: publicRoster[3],
    });
    expect(tokens[1]).toEqual({ kind: "text", text: "'s PR" });
  });
});

describe("buildCheckInHtml", () => {
  it("escapes text and renders bullets as one list with a paragraph after", () => {
    const html = buildCheckInHtml(
      "- Fixed A & B <bug>\n- Shipped \"v2\"\n\nNote for @Michael",
      roster,
      rules
    );
    expect(html).toBe(
      "<ul><li>Fixed A &amp; B &lt;bug&gt;</li><li>Shipped &quot;v2&quot;</li></ul>" +
        "<p>Note for Michael</p>"
    );
  });

  it("emits mention tags with the sgid from the full roster", () => {
    const html = buildCheckInHtml("- Thanks @Vincent", roster, rules);
    expect(html).toBe(
      '<ul><li>Thanks <bc-attachment sgid="SGID-VR" content-type="application/vnd.basecamp.mention"></bc-attachment></li></ul>'
    );
  });

  it("appends the image attachment after the body", () => {
    const html = buildCheckInHtml("- Done", roster, rules, "IMG-SGID");
    expect(html.endsWith('<bc-attachment sgid="IMG-SGID"></bc-attachment>')).toBe(
      true
    );
    expect(html.startsWith("<ul><li>Done</li></ul>")).toBe(true);
  });

  it("lists unresolved mentions for the preview", () => {
    const found = unresolvedMentions("- @Tyler and @Zed", roster, rules);
    expect(found.map((t) => t.raw)).toEqual(["@Tyler", "@Zed"]);
  });
});
