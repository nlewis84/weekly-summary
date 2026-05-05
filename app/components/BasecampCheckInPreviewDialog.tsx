import { useEffect, useId, useRef } from "react";

interface BasecampCheckInPreviewDialogProps {
  open: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  granolaWarning?: string | null;
  granolaConfigured?: boolean;
  isBusy: boolean;
  onCancel: () => void;
  onPost: () => void;
  onSaveOnly: () => void;
}

export function BasecampCheckInPreviewDialog({
  open,
  draft,
  onDraftChange,
  granolaWarning,
  granolaConfigured = false,
  isBusy,
  onCancel,
  onPost,
  onSaveOnly,
}: BasecampCheckInPreviewDialogProps) {
  const titleId = useId();
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

  if (!open) return null;

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
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[min(90vh,640px)] w-[min(96vw,560px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-(--color-border) bg-surface shadow-xl"
      >
        <div className="shrink-0 border-b border-(--color-border) px-4 py-3">
          <h2
            id={titleId}
            className="text-lg font-semibold text-(--color-text)"
          >
            Preview Basecamp check-in
          </h2>
          <p className="mt-1 text-xs text-text-muted">
            Edit the text below, then post to Basecamp or save the snapshot only.
            {granolaConfigured
              ? " Meeting lines come from Granola when your API key is set."
              : " Add GRANOLA_API_KEY to include meeting summaries from Granola."}
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
          <button
            type="button"
            onClick={onSaveOnly}
            disabled={isBusy}
            className="rounded-lg border border-(--color-border) px-3 py-2 text-sm text-(--color-text) transition-colors hover:bg-surface-elevated disabled:opacity-50"
          >
            Save without posting
          </button>
          <button
            type="button"
            onClick={onPost}
            disabled={isBusy || !draft.trim()}
            className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-500 disabled:opacity-50"
          >
            Post to Basecamp
          </button>
        </div>
      </div>
    </>
  );
}
