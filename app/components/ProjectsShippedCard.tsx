import {
  RocketLaunch,
  ArrowUpRight,
  CalendarCheck,
  CheckCircle,
  Target,
  User,
} from "phosphor-react";
import type { Payload } from "../../lib/types";
import {
  durationLabel,
  formatProjectDate,
  issuesLabel,
  readProject,
  targetLabel,
  type ShippedProject,
} from "~/lib/project-facts";

interface ProjectsShippedCardProps {
  projects: NonNullable<Payload["linear"]["completed_projects"]>;
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

function LinearLink({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="shrink-0 inline-flex items-center gap-1 text-sm font-medium text-primary-500 hover:text-primary-400 transition-colors"
    >
      Linear
      <ArrowUpRight size={14} weight="bold" />
    </a>
  );
}

function ProjectBlock({
  project,
  showLink,
}: {
  project: ShippedProject;
  showLink: boolean;
}) {
  const duration = durationLabel(project);
  const target = targetLabel(project);
  const completedOn = formatProjectDate(project.completedAt);
  const issues = issuesLabel(project);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-2xl sm:text-3xl font-semibold text-(--color-text) leading-tight tracking-tight">
          {project.title}
        </h3>
        {showLink && project.url && (
          <div className="mt-1">
            <LinearLink url={project.url} />
          </div>
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
  const single = parsed.length === 1;

  return (
    <section
      aria-label="Projects shipped"
      className="relative overflow-hidden rounded-xl border border-primary-500/40 bg-primary-500/10 shadow-(--shadow-skeuo-card) p-5 sm:p-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary-500/60"
      />

      {/* With one project the link belongs in the card's top-right corner; with
          several, each block carries its own beside its title. */}
      <div className="flex items-center justify-between gap-4 pb-5">
        <div className="flex items-center gap-2 min-w-0">
          <RocketLaunch size={22} weight="fill" className="text-primary-500" />
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-500">
            {single ? "Project shipped" : `${parsed.length} projects shipped`}
          </h2>
        </div>
        {single && parsed[0].url && <LinearLink url={parsed[0].url} />}
      </div>

      <div className="divide-y divide-primary-500/20">
        {parsed.map((project, idx) => (
          <div
            key={project.url ?? idx}
            className={idx > 0 ? "pt-6" : undefined}
          >
            <ProjectBlock project={project} showLink={!single} />
          </div>
        ))}
      </div>
    </section>
  );
}
