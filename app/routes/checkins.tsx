import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { useState, useCallback, useEffect, useRef } from "react";
import { ArrowSquareOut, CalendarBlank, Clock, X } from "phosphor-react";
import { isBasecampConfigured } from "../../lib/basecamp-post";
import { fetchMyRecentCheckIns } from "../../lib/basecamp-fetch";
import type { CheckInAnswer } from "../../lib/basecamp-fetch";
import { ErrorBanner } from "../components/ErrorBanner";

interface LoaderData {
  answers: CheckInAnswer[];
  configured: boolean;
  error: string | null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return data(
      { answers: [], configured: false, error: "Method not allowed" } satisfies LoaderData,
      { status: 405 }
    );
  }

  if (!isBasecampConfigured()) {
    return data({
      answers: [],
      configured: false,
      error: null,
    } satisfies LoaderData);
  }

  try {
    const answers = await fetchMyRecentCheckIns({ limit: 50 });
    return data({ answers, configured: true, error: null } satisfies LoaderData);
  } catch (err) {
    console.error("Check-ins loader error:", err);
    return data({
      answers: [],
      configured: true,
      error: (err as Error).message,
    } satisfies LoaderData);
  }
}

function formatDateHeading(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupByDate(answers: CheckInAnswer[]): [string, CheckInAnswer[]][] {
  const groups = new Map<string, CheckInAnswer[]>();
  for (const answer of answers) {
    const existing = groups.get(answer.date);
    if (existing) existing.push(answer);
    else groups.set(answer.date, [answer]);
  }
  return [...groups.entries()];
}

function shortQuestionLabel(title: string): string {
  return title
    .replace(/^Apollos\s+(Engineering|Operations):\s*/i, "")
    .replace(/\?$/, "");
}

function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-zoom-out"
      onClick={(e) => {
        if (e.target === backdropRef.current || e.target === e.currentTarget)
          onClose();
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
        aria-label="Close"
      >
        <X size={28} weight="bold" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-200"
      />
    </div>
  );
}

export default function CheckIns() {
  const { answers, configured, error } = useLoaderData<typeof loader>() as LoaderData;
  const [lightbox, setLightbox] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const handleContentClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const img = (e.target as HTMLElement).closest(
        ".bc-image"
      ) as HTMLImageElement | null;
      if (!img) return;

      e.preventDefault();
      e.stopPropagation();
      setLightbox({ src: img.src, alt: img.alt });
    },
    []
  );

  const closeLightbox = useCallback(() => setLightbox(null), []);

  if (!configured) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-(--color-text)">Check-ins</h2>
        <div className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) p-8 text-center text-text-muted border border-(--color-border)">
          <p>Basecamp is not configured.</p>
          <p className="text-sm mt-2">
            Set <code className="text-primary-500">BASECAMP_PROJECT_ID</code> and{" "}
            <code className="text-primary-500">BASECAMP_CHECKIN_QUESTION_ID</code> in your{" "}
            <code>.env</code> to enable check-in browsing.
          </p>
        </div>
      </div>
    );
  }

  const grouped = groupByDate(answers);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-(--color-text)">Check-ins</h2>
        {answers.length > 0 && (
          <span className="text-xs text-text-muted tabular-nums">
            {answers.length} answer{answers.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {error && <ErrorBanner message={error} />}

      {answers.length === 0 && !error && (
        <div className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) p-8 text-center text-text-muted border border-(--color-border)">
          No check-in answers found.
        </div>
      )}

      {grouped.map(([date, dayAnswers]) => (
        <section key={date} className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text-muted uppercase tracking-wide">
            <CalendarBlank size={16} weight="regular" className="text-primary-500" />
            {formatDateHeading(date)}
          </h3>

          {dayAnswers.map((answer) => (
            <article
              key={answer.id}
              className="bg-surface rounded-xl shadow-(--shadow-skeuo-card) border border-(--color-border) overflow-hidden"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-surface-elevated/50 border-b border-(--color-border)">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                        className={`shrink-0 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded ${
                      answer.questionType === "weekly"
                        ? "bg-primary-600/20 text-primary-400"
                        : "bg-gray-200/50 text-text-muted"
                    }`}
                  >
                    {answer.questionType === "weekly" ? "Weekly" : "Daily"}
                  </span>
                  <span className="text-xs text-text-muted truncate">
                    {shortQuestionLabel(answer.questionTitle)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 shrink-0 text-text-muted">
                  <span className="flex items-center gap-1 text-xs tabular-nums">
                    <Clock size={12} weight="regular" />
                    {formatTime(answer.createdAt)}
                  </span>
                  <a
                    href={answer.appUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-500 transition-colors"
                    title="Open in Basecamp"
                  >
                    <ArrowSquareOut size={14} weight="regular" />
                  </a>
                </div>
              </div>

              <div
                className="checkin-content px-4 py-3 text-sm leading-relaxed text-(--color-text)"
                dangerouslySetInnerHTML={{ __html: answer.content }}
                onClick={handleContentClick}
              />
            </article>
          ))}
        </section>
      ))}

      {lightbox && (
        <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />
      )}
    </div>
  );
}
