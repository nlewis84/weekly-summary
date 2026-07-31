import {
  RocketLaunch,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle,
  Target,
  User,
} from "phosphor-react";
import type { Payload } from "../../lib/types";

interface ProjectsShippedCardProps {
  projects: NonNullable<Payload["linear"]["completed_projects"]>;
}

type ShippedProject = {
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

function readProject(raw: Record<string, unknown>): ShippedProject {
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

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  // TimelessDate ("2026-07-31") is parsed as UTC midnight; pin it to local noon
  // so day-count math doesn't slip a day across timezones.
  const d = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value: string | null): string | null {
  const d = parseDate(value);
  if (!d) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysBetween(from: Date, to: Date): number {
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(to) - startOfDay(from)) / 86_400_000);
}

/** "10 days in flight" — how long the project ran before it shipped. */
function durationLabel(p: ShippedProject): string | null {
  const started = parseDate(p.startedAt);
  const completed = parseDate(p.completedAt);
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
function targetLabel(p: ShippedProject): string | null {
  const target = parseDate(p.targetDate);
  const completed = parseDate(p.completedAt);
  if (!target || !completed) return null;
  const days = daysBetween(target, completed);
  if (days === 0) return "On target";
  const magnitude = Math.abs(days) === 1 ? "1 day" : `${Math.abs(days)} days`;
  return days < 0 ? `${magnitude} early` : `${magnitude} late`;
}

function Fact({
  Icon,
  children,
}: {
  Icon: typeof RocketLaunch;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon size={16} weight="regular" className="shrink-0 text-primary-500" />
      <span className="text-sm text-text-muted truncate">{children}</span>
    </div>
  );
}

function ProjectBlock({ project }: { project: ShippedProject }) {
  const duration = durationLabel(project);
  const target = targetLabel(project);
  const completedOn = formatDate(project.completedAt);
  const issues =
    project.issueCount > 0
      ? `${project.completedIssueCount} of ${project.issueCount} issue${
          project.issueCount === 1 ? "" : "s"
        } done`
      : null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl sm:text-3xl font-semibold text-(--color-text) leading-tight tracking-tight">
          {project.title}
        </h3>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-1 mt-1 text-sm font-medium text-primary-500 hover:text-primary-400 transition-colors"
          >
            Linear
            <ArrowUpRight size={14} weight="bold" />
          </a>
        )}
      </div>

      {project.description && (
        <p className="text-sm text-text-muted max-w-2xl leading-relaxed">
          {project.description}
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-x-6 gap-y-2 pt-1">
        {completedOn && (
          <Fact Icon={CalendarCheck}>Completed {completedOn}</Fact>
        )}
        {duration && <Fact Icon={RocketLaunch}>{duration}</Fact>}
        {issues && <Fact Icon={CheckCircle}>{issues}</Fact>}
        {target && <Fact Icon={Target}>{target}</Fact>}
        {project.lead && <Fact Icon={User}>Lead: {project.lead}</Fact>}
      </div>
    </div>
  );
}

/**
 * Projects you finished this week, given top billing on the weekly view.
 * A shipped project is the biggest thing in a week — it gets the accent panel,
 * display-size naming, and its shipping context, not a line in a list.
 */
export function ProjectsShippedCard({ projects }: ProjectsShippedCardProps) {
  if (projects.length === 0) return null;

  const parsed = projects.map(readProject);

  return (
    <section
      aria-label="Projects shipped"
      className="relative overflow-hidden rounded-xl border border-primary-500/40 bg-primary-500/10 shadow-(--shadow-skeuo-card) p-5 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary-500/60"
      />

      <div className="flex items-center gap-2 pb-5">
        <RocketLaunch size={22} weight="fill" className="text-primary-500" />
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-500">
          {parsed.length === 1
            ? "Project shipped"
            : `${parsed.length} projects shipped`}
        </h2>
      </div>

      <div className="divide-y divide-primary-500/20">
        {parsed.map((project, idx) => (
          <div
            key={project.url ?? idx}
            className={idx > 0 ? "pt-6" : undefined}
          >
            <ProjectBlock project={project} />
          </div>
        ))}
      </div>
    </section>
  );
}
