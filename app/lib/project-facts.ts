/**
 * Shared reading/formatting for completed Linear projects, so the weekly hero
 * card and the annual roster describe the same project identically.
 */

export type ShippedProject = {
  title: string;
  url: string | null;
  description: string | null;
  completedAt: string | null;
  startedAt: string | null;
  targetDate: string | null;
  lead: string | null;
  issueCount: number;
  completedIssueCount: number;
};

export function readProject(raw: Record<string, unknown>): ShippedProject {
  return {
    title: (raw.title as string) ?? "",
    url: (raw.url as string | null) ?? null,
    description: (raw.description as string | null) ?? null,
    completedAt: (raw.completedAt as string | null) ?? null,
    startedAt: (raw.startedAt as string | null) ?? null,
    targetDate: (raw.targetDate as string | null) ?? null,
    lead: (raw.lead as string | null) ?? null,
    issueCount: typeof raw.issue_count === "number" ? raw.issue_count : 0,
    completedIssueCount:
      typeof raw.completed_issue_count === "number"
        ? raw.completed_issue_count
        : 0,
  };
}

export function parseProjectDate(value: string | null): Date | null {
  if (!value) return null;
  // TimelessDate ("2026-07-31") is parsed as UTC midnight; pin it to local noon
  // so day-count math doesn't slip a day across timezones.
  const d = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatProjectDate(value: string | null): string | null {
  const d = parseProjectDate(value);
  if (!d) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysBetween(from: Date, to: Date): number {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}

/** "10 days in flight" — how long the project ran before it shipped. */
export function durationLabel(p: ShippedProject): string | null {
  const started = parseProjectDate(p.startedAt);
  const completed = parseProjectDate(p.completedAt);
  if (!started || !completed) return null;
  const days = daysBetween(started, completed);
  if (days < 0) return null;
  if (days === 0) return "Shipped same day";
  if (days === 1) return "1 day in flight";
  if (days < 21) return `${days} days in flight`;
  const weeks = Math.round(days / 7);
  return `${weeks} weeks in flight`;
}

/** "3 days early" / "On target" / "5 days late" against the project's target date. */
export function targetLabel(p: ShippedProject): string | null {
  const target = parseProjectDate(p.targetDate);
  const completed = parseProjectDate(p.completedAt);
  if (!target || !completed) return null;
  const days = daysBetween(target, completed);
  if (days === 0) return "On target";
  const magnitude = Math.abs(days) === 1 ? "1 day" : `${Math.abs(days)} days`;
  return days < 0 ? `${magnitude} early` : `${magnitude} late`;
}

/** "12 of 14 issues done"; null when Linear reports no scope. */
export function issuesLabel(p: ShippedProject): string | null {
  if (p.issueCount <= 0) return null;
  return `${p.completedIssueCount} of ${p.issueCount} issue${
    p.issueCount === 1 ? "" : "s"
  } done`;
}
