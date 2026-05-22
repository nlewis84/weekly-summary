import { describe, expect, it } from "vitest";
import { preserveLineBreaksForBasecamp } from "./basecamp-post";

describe("preserveLineBreaksForBasecamp", () => {
  it("turns single newlines between plain lines into markdown hard breaks", () => {
    const input = [
      "Gratitude Posts script merged and ran in staging/prod",
      "Fix for Gratitude Posts in Mobile app",
      "Turned on New Gratitude for Grace 🎉",
    ].join("\n");

    expect(preserveLineBreaksForBasecamp(input)).toBe(
      [
        "Gratitude Posts script merged and ran in staging/prod  ",
        "Fix for Gratitude Posts in Mobile app  ",
        "Turned on New Gratitude for Grace 🎉",
      ].join("\n")
    );
  });

  it("preserves blank lines as paragraph breaks without adding hard breaks", () => {
    const input = ["First line", "", "Second paragraph"].join("\n");
    expect(preserveLineBreaksForBasecamp(input)).toBe(input);
  });

  it("leaves bulleted list items untouched", () => {
    const input = ["- Item one", "- Item two", "- Item three"].join("\n");
    expect(preserveLineBreaksForBasecamp(input)).toBe(input);
  });

  it("leaves numbered list items untouched", () => {
    const input = ["1. First", "2. Second", "3. Third"].join("\n");
    expect(preserveLineBreaksForBasecamp(input)).toBe(input);
  });

  it("leaves headings untouched", () => {
    const input = ["# Heading", "## Subheading", "Body text"].join("\n");
    expect(preserveLineBreaksForBasecamp(input)).toBe(input);
  });

  it("does not double-up existing hard breaks", () => {
    const input = ["First line  ", "Second line"].join("\n");
    expect(preserveLineBreaksForBasecamp(input)).toBe(input);
  });

  it("does not modify content inside fenced code blocks", () => {
    const input = [
      "Intro",
      "```",
      "const a = 1;",
      "const b = 2;",
      "```",
      "Outro",
    ].join("\n");
    expect(preserveLineBreaksForBasecamp(input)).toBe(
      [
        "Intro  ",
        "```",
        "const a = 1;",
        "const b = 2;",
        "```",
        "Outro",
      ].join("\n")
    );
  });

  it("handles CRLF line endings", () => {
    const input = "First\r\nSecond\r\nThird";
    expect(preserveLineBreaksForBasecamp(input)).toBe(
      "First  \nSecond  \nThird"
    );
  });

  it("does not add a trailing hard break on the final line", () => {
    const out = preserveLineBreaksForBasecamp("Only line");
    expect(out).toBe("Only line");
  });

  it("handles mixed plain text and bullets without changing list semantics", () => {
    const input = [
      "Worked on stuff today",
      "",
      "- merged a PR",
      "- reviewed two more",
      "",
      "Tomorrow plan",
    ].join("\n");
    expect(preserveLineBreaksForBasecamp(input)).toBe(input);
  });
});
