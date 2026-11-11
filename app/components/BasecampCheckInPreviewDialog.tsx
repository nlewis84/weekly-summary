import { useEffect, useId, useMemo, useRef } from "react";
import { tokenizeMentions } from "../../lib/checkin-mentions";
import type {
  MentionRules,
  MentionToken,
  RosterPersonPublic,
} from "../../lib/checkin-types";

interface BasecampCheckInPreviewDialogProps {
  open: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  granolaWarning?: string | null;
  granolaConfigured?: boolean;
  title?: string;
  description?: string;
  postLabel?: string;
  screenshotUrl?: string;
  screenshots?: { url: string; name: string }[];
  screenshotError?: string;
  writerNotes?: string;
  roster?: RosterPersonPublic[];
  mentionRules?: MentionRules;
  isBusy: boolean;
  onCancel: () => void;
  onPost: () => void;
  onSaveOnly?: () => void;
}

export function BasecampCheckInPreviewDialog({
  open,
  draft,
  onDraftChange,
  granolaWarning,
  granolaConfigured = false,
  title = "Preview Basecamp check-in",
  description,
  postLabel = "Post to Basecamp",
  screenshotUrl,
  screenshots,
  screenshotError,
  writerNotes,
  roster = [],
  mentionRules = { plain: [], ambiguous: [] },
  isBusy,
  onCancel,
  onPost,
  onSaveOnly,
}: BasecampCheckInPreviewDialogProps) {
  const titleId = useId();
  const shots =
    screenshots ??
    (screenshotUrl ? [{ url: screenshotUrl, name: "Screenshot" }] : []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) {
      queueMicrotask(() => textareaRef.current?.focus());
    }
  }, [open]);

  const lines = useMemo(
    () =>
      draft
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => {
          const bullet = l.startsWith("- ");
          const text = bullet ? l.slice(2) : l;
          return { bullet, segments: splitBold(text, bullet, roster, mentionRules) };
        }),
    [draft, roster, mentionRules]
  );

  if (!open) return null;

  const renderSegments = (segments: Segment[]) =>
    segments.map((seg, si) => {
      if (seg.kind === "bold") {
        return (
          <strong
            key={si}
            className={
              seg.highlight
                ? "rounded bg-amber-500/20 px-1 font-semibold"
                : "font-semibold"
            }
          >
            {seg.text}
          </strong>
        );
      }
      return <span key={si}>{renderTokens(seg.tokens)}</span>;
    });

  const renderTokens = (tokens: MentionToken[]) =>
    tokens.map((t, i) => {
      if (t.kind === "text") return <span key={i}>{t.text}</span>;
      if (t.kind === "plain") return <span key={i}>{t.text}</span>;
      if (t.kind === "person") {
        return (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-surface-elevated px-1.5 py-0.5 align-middle text-xs"
          >
            <img
              src={t.person.avatarUrl}
              alt=""
              className="size-4 rounded-full"
            />
            {t.person.firstName}
          </span>
        );
      }
      const title =
        t.reason === "ambiguous"
          ? `Ambiguous: ${t.candidates.join(", ")} — write the full name`
          : "Not in Basecamp — will post as plain text";
      return (
        <span
          key={i}
          title={title}
          className="rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-200"
        >
          {t.raw}
        </span>
      );
    });

  const noteClass =
    "mb-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 cursor-pointer"
        aria-hidden="true"
        onClick={onCancel}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,760px)] w-[min(96vw,720px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-(--color-border) bg-surface shadow-xl"
      >
        <div className="shrink-0 border-b border-(--color-border) px-4 py-3">
          <h2
            id={titleId}
            className="text-lg font-semibold text-(--color-text)"
          >
            {title}
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            {description ??
              `Edit the text below, then post to Basecamp or save the snapshot only.${
                granolaConfigured
                  ? " Meeting lines come from Granola when your API key is set."
                  : " Add GRANOLA_API_KEY to include meeting summaries from Granola."
              }`}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {granolaWarning ? (
            <p
              className="mb-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200"
              role="status"
            >
              Granola could not be loaded: {granolaWarning}
            </p>
          ) : null}
          {writerNotes ? (
            <p className={noteClass} role="status">
              {writerNotes}
            </p>
          ) : null}
          {screenshotError ? (
            <p className={noteClass} role="status">
              Screenshot failed: {screenshotError}
            </p>
          ) : null}
          <label className="sr-only" htmlFor={`${titleId}-body`}>
            Check-in body
          </label>
          <textarea
            ref={textareaRef}
            id={`${titleId}-body`}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            disabled={isBusy}
            rows={14}
            className="w-full resize-y rounded-lg border border-(--color-border) bg-surface-elevated px-3 py-2 font-mono text-sm text-(--color-text) placeholder:text-text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-60"
          />

          <h3 className="mb-1 mt-3 text-xs font-medium text-text-muted">
            Preview
          </h3>
          <div className="rounded-lg border border-(--color-border) px-3 py-2 text-sm text-(--color-text)">
            {lines.length === 0 ? (
              <p className="text-text-muted">Nothing to preview.</p>
            ) : (
              <>
                {groupLines(lines).map((g, gi) =>
                  g.bullet ? (
                    <ul key={gi} className="list-disc space-y-1 pl-5">
                      {g.items.map((it, i) => (
                        <li key={i}>{renderSegments(it)}</li>
                      ))}
                    </ul>
                  ) : (
                    g.items.map((it, i) => (
                      <p key={`${gi}-${i}`} className="my-1">
                        {renderSegments(it)}
                      </p>
                    ))
                  )
                )}
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {shots.length > 0 ? (
              shots.map((shot) => (
                <a key={shot.url} href={shot.url} target="_blank" rel="noreferrer">
                  <img
                    src={shot.url}
                    alt={`Screenshot: ${shot.name}`}
                    className="max-h-40 rounded-lg border border-(--color-border)"
                  />
                </a>
              ))
            ) : (
              <p className="text-xs text-text-muted">No screenshot</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-(--color-border) px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-elevated hover:text-(--color-text) disabled:opacity-50"
          >
            Cancel
          </button>
          {onSaveOnly ? (
            <button
              type="button"
              onClick={onSaveOnly}
              disabled={isBusy}
              className="rounded-lg border border-(--color-border) px-3 py-2 text-sm text-(--color-text) transition-colors hover:bg-surface-elevated disabled:opacity-50"
            >
              Save without posting
            </button>
          ) : null}
          <button
            type="button"
            onClick={onPost}
            disabled={isBusy || !draft.trim()}
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
          >
            {postLabel}
          </button>
        </div>
      </div>
    </>
  );
}

type Segment =
  | { kind: "bold"; text: string; highlight: boolean }
  | { kind: "tokens"; tokens: MentionToken[] };

type Line = { bullet: boolean; segments: Segment[] };

/** Splits `**bold**` runs out of a line; mentions are tokenized in the rest. */
function splitBold(
  text: string,
  bullet: boolean,
  roster: RosterPersonPublic[],
  rules: MentionRules
): Segment[] {
  const segments: Segment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const pushText = (t: string) => {
    if (t) segments.push({ kind: "tokens", tokens: tokenizeMentions(t, roster, rules) });
  };
  while ((m = re.exec(text))) {
    pushText(text.slice(last, m.index));
    segments.push({
      kind: "bold",
      text: m[1],
      highlight: bullet && m.index === 0,
    });
    last = m.index + m[0].length;
  }
  pushText(text.slice(last));
  return segments;
}

function groupLines(
  lines: Line[]
): { bullet: boolean; items: Segment[][] }[] {
  const groups: { bullet: boolean; items: Segment[][] }[] = [];
  for (const l of lines) {
    const last = groups[groups.length - 1];
    if (last && last.bullet === l.bullet) last.items.push(l.segments);
    else groups.push({ bullet: l.bullet, items: [l.segments] });
  }
  return groups;
}
