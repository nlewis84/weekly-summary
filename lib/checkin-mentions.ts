import type {
  MentionRules,
  MentionToken,
  RosterPerson,
  RosterPersonPublic,
} from "./checkin-types.js";

type UnresolvedToken = Extract<MentionToken, { kind: "unresolved" }>;

const WORD = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/u;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** True when the character at `index` is missing or cannot continue a name. */
function endsName(text: string, index: number): boolean {
  return index >= text.length || !LETTER_OR_DIGIT.test(text[index]);
}

/** Matches `name` at `start`, case-insensitively, on a name boundary. */
function matchName(text: string, start: number, name: string): string | null {
  const candidate = text.slice(start, start + name.length);
  if (candidate.toLowerCase() !== name.toLowerCase()) return null;
  if (!endsName(text, start + name.length)) return null;
  return candidate;
}

function sameFirstName(person: RosterPersonPublic, word: string): boolean {
  return person.firstName.toLowerCase() === word.toLowerCase();
}

/**
 * Reads the mention that starts at `at` (the "@"). Returns null when the
 * text there is not a mention, so the caller keeps the "@" as text.
 */
function readMention(
  text: string,
  at: number,
  roster: RosterPersonPublic[],
  rules: MentionRules
): { token: MentionToken; raw: string } | null {
  const start = at + 1;

  // Longest explicit match wins: plain entries and full roster names.
  const explicit: { raw: string; token: MentionToken }[] = [];

  for (const name of rules.plain) {
    const matched = matchName(text, start, name);
    if (matched !== null) {
      explicit.push({
        raw: `@${matched}`,
        token: { kind: "plain", raw: `@${matched}`, text: matched },
      });
    }
  }

  for (const person of roster) {
    const matched = matchName(text, start, person.name);
    if (matched !== null) {
      explicit.push({
        raw: `@${matched}`,
        token: { kind: "person", raw: `@${matched}`, person },
      });
    }
  }

  if (explicit.length > 0) {
    explicit.sort((a, b) => b.raw.length - a.raw.length);
    const best = explicit[0];
    return { token: best.token, raw: best.raw };
  }

  const wordMatch = WORD.exec(text.slice(start));
  if (!wordMatch) return null;

  const word = wordMatch[0];
  const raw = `@${word}`;
  const ambiguousWord = rules.ambiguous.some(
    (a) => a.toLowerCase() === word.toLowerCase()
  );
  const sameFirst = roster.filter((p) => sameFirstName(p, word));

  if (!ambiguousWord && sameFirst.length === 1) {
    return { token: { kind: "person", raw, person: sameFirst[0] }, raw };
  }

  if (ambiguousWord || sameFirst.length > 1) {
    return {
      token: {
        kind: "unresolved",
        raw,
        text: word,
        reason: "ambiguous",
        candidates: sameFirst.map((p) => p.name),
      },
      raw,
    };
  }

  return {
    token: {
      kind: "unresolved",
      raw,
      text: word,
      reason: "unknown",
      candidates: [],
    },
    raw,
  };
}

/** Splits one line into text and mention tokens. */
export function tokenizeMentions(
  text: string,
  roster: RosterPersonPublic[],
  rules: MentionRules
): MentionToken[] {
  const tokens: MentionToken[] = [];
  let buffer = "";

  const flush = () => {
    if (buffer) {
      tokens.push({ kind: "text", text: buffer });
      buffer = "";
    }
  };

  let i = 0;
  while (i < text.length) {
    const atStart = i === 0 || /[\s(]/.test(text[i - 1]);
    if (text[i] === "@" && atStart) {
      const mention = readMention(text, i, roster, rules);
      if (mention) {
        flush();
        tokens.push(mention.token);
        i += mention.raw.length;
        continue;
      }
    }
    buffer += text[i];
    i += 1;
  }
  flush();

  return tokens;
}

interface Line {
  bullet: boolean;
  content: string;
}

/** Non-empty lines, with the "- " or "* " bullet marker removed. */
function parseLines(body: string): Line[] {
  const lines: Line[] = [];
  for (const raw of body.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const bullet = /^[-*] /.test(trimmed);
    lines.push({ bullet, content: bullet ? trimmed.slice(2) : trimmed });
  }
  return lines;
}

/** Unresolved mentions in the body, in order of appearance. */
export function unresolvedMentions(
  body: string,
  roster: RosterPerson[],
  rules: MentionRules
): UnresolvedToken[] {
  const found: UnresolvedToken[] = [];
  for (const line of parseLines(body)) {
    for (const token of tokenizeMentions(line.content, roster, rules)) {
      if (token.kind === "unresolved") found.push(token);
    }
  }
  return found;
}

function renderTokens(
  tokens: MentionToken[],
  sgidById: Map<number, string>
): string {
  return tokens
    .map((token) => {
      switch (token.kind) {
        case "text":
          return escapeHtml(token.text);
        case "person": {
          const sgid = sgidById.get(token.person.id);
          if (!sgid) return escapeHtml(token.person.name);
          return `<bc-attachment sgid="${escapeHtml(sgid)}" content-type="application/vnd.basecamp.mention"></bc-attachment>`;
        }
        case "plain":
          return escapeHtml(token.text);
        case "unresolved":
          return escapeHtml(token.text);
      }
    })
    .join("");
}

/** Builds the Basecamp check-in body: a list for "- " lines, paragraphs otherwise. */
export function buildCheckInHtml(
  body: string,
  roster: RosterPerson[],
  rules: MentionRules,
  imageSgid?: string
): string {
  const sgidById = new Map(roster.map((p) => [p.id, p.sgid]));
  const parts: string[] = [];
  let listOpen = false;

  for (const line of parseLines(body)) {
    const html = renderTokens(
      tokenizeMentions(line.content, roster, rules),
      sgidById
    );
    if (line.bullet) {
      if (!listOpen) {
        parts.push("<ul>");
        listOpen = true;
      }
      parts.push(`<li>${html}</li>`);
    } else {
      if (listOpen) {
        parts.push("</ul>");
        listOpen = false;
      }
      parts.push(`<p>${html}</p>`);
    }
  }
  if (listOpen) parts.push("</ul>");

  if (imageSgid) {
    parts.push(
      `<bc-attachment sgid="${escapeHtml(imageSgid)}"></bc-attachment>`
    );
  }

  return parts.join("");
}
