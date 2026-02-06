import { useEffect, useState } from "react";

const SHORTCUTS = [
  { key: "r", description: "Refresh data" },
  { key: "?", description: "Show keyboard shortcuts" },
  { key: "b", description: "Scroll to Build Summary" },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "?" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        const target = e.target as HTMLElement;
        if (!target.closest("input, textarea, [contenteditable]")) {
          e.preventDefault();
          setOpen((o) => !o);
        }
      }
      if (e.key === "Escape") setOpen(false);
      if (
        e.key === "b" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !e.shiftKey
      ) {
        const target = e.target as HTMLElement;
        if (!target.closest("input, textarea, [contenteditable]")) {
          e.preventDefault();
          setOpen(false);
          if (window.location.pathname === "/") {
            document
              .getElementById("build-summary")
              ?.scrollIntoView({ behavior: "smooth" });
            window.location.hash = "#build-summary";
          } else {
            window.location.href = "/#build-summary";
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 cursor-pointer"
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface border border-(--color-border) shadow-xl p-6"
      >
        <h2
          id="shortcuts-title"
          className="text-lg font-semibold text-(--color-text) mb-4"
        >
          Keyboard shortcuts
        </h2>
        <ul className="space-y-3">
          {SHORTCUTS.map(({ key, description }) => (
            <li key={key} className="flex items-center justify-between gap-4">
              <kbd className="px-2 py-1 text-sm font-mono bg-surface-elevated border border-(--color-border) rounded">
                {key}
              </kbd>
              <span className="text-sm text-text-muted">
                {description}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-text-muted">
          Press{" "}
          <kbd className="px-1 py-0.5 font-mono bg-surface-elevated rounded">
            Esc
          </kbd>{" "}
          to close
        </p>
      </div>
    </>
  );
}
