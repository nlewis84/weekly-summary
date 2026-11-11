/** Safe to send to the browser: no sgid. */
export interface RosterPersonPublic {
  id: number;
  name: string;
  firstName: string;
  avatarUrl: string;
}

/** Server-only: includes the sgid Basecamp needs to render a mention. */
export interface RosterPerson extends RosterPersonPublic {
  sgid: string;
}

export interface MentionRules {
  /** Names that are never tagged; a leading "@" is dropped. */
  plain: string[];
  /** First names shared by more than one person; tagging needs the full name. */
  ambiguous: string[];
}

export type MentionToken =
  | { kind: "text"; text: string }
  | { kind: "person"; raw: string; person: RosterPersonPublic }
  | { kind: "plain"; raw: string; text: string }
  | {
      kind: "unresolved";
      raw: string;
      text: string;
      reason: "ambiguous" | "unknown";
      candidates: string[];
    };

export interface CheckInWriterResult {
  draft: string;
  notes?: string;
  /** True when the LLM failed and the draft is the old formatter's output. */
  usedFallback: boolean;
}

/** A weekly screenshot the server captured, sent to the browser for the thumbnail. */
export interface WeeklyScreenshotPreview {
  name: string;
  dataUrl: string;
}

/** Returned by /api/summary when "Post to Basecamp" is checked on Generate & Save. */
export interface WeeklyBasecampPreview {
  weekEnding: string;
  draft: string;
  notes?: string;
  usedFallback: boolean;
  roster: RosterPersonPublic[];
  mentionRules: MentionRules;
  screenshots: WeeklyScreenshotPreview[];
}
