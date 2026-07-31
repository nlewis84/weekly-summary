#!/usr/bin/env -S npx tsx
import "dotenv/config";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildMarkdownSummary } from "../lib/markdown";
import type { Payload } from "../lib/types";

/**
 * Backfill completed Linear projects into historical weekly summaries.
 * For each week's window, fetches projects you led or belonged to that reached a
 * completed status, then updates the JSON with linear.completed_projects,
 * stats.linear_projects_completed, and stats.linear_completed — and rewrites the
 * matching .md so the "Projects completed" section shows up there too.
 *
 * Re-runnable: linear_completed is recomputed as issues + projects, never incremented.
 *
 * Usage: npx tsx scripts/backfill-linear-projects.ts [--dry-run]
 */

const LINEAR_API_BASE = "https://api.linear.app/graphql";

const LINEAR_USER_QUERY = `
  query GetViewer {
    viewer { id name email }
  }
`;

// Mirrors LINEAR_COMPLETED_PROJECTS_QUERY in lib/summary.ts.
const LINEAR_COMPLETED_PROJECTS_QUERY = `
  query GetCompletedProjects($userId: ID!, $completedAfter: DateTimeOrDuration!, $completedBefore: DateTimeOrDuration!, $after: String) {
    projects(filter: { completedAt: { gte: $completedAfter, lte: $completedBefore }, or: [{ lead: { id: { eq: $userId } } }, { members: { id: { eq: $userId } } }] }, first: 50, after: $after) {
      nodes {
        id name url description completedAt startedAt startDate targetDate
        scope progress
        status { name type }
        lead { id name }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type ProjectNode = {
  id?: string;
  name?: string;
  url?: string | null;
  description?: string | null;
  completedAt?: string | null;
  startedAt?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  status?: { name?: string; type?: string } | null;
  lead?: { id?: string; name?: string } | null;
  scope?: number | null;
  progress?: number | null;
};

async function fetchLinearPage(
  headers: Record<string, string>,
  query: string,
  variables: Record<string, unknown>
) {
  const res = await fetch(LINEAR_API_BASE, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.errors
      ? JSON.stringify(data.errors)
      : (data?.message ?? res.statusText);
    throw new Error(`Linear API ${res.status}: ${msg}`);
  }
  if (data.errors)
    throw new Error(`Linear errors: ${JSON.stringify(data.errors)}`);
  return data.data;
}

async function fetchCompletedProjects(
  headers: Record<string, string>,
  userId: string,
  windowStartISO: string,
  windowEndISO: string
): Promise<ProjectNode[]> {
  const all: ProjectNode[] = [];
  let after: string | null = null;
  do {
    const data = await fetchLinearPage(
      headers,
      LINEAR_COMPLETED_PROJECTS_QUERY,
      {
        userId,
        completedAfter: windowStartISO,
        completedBefore: windowEndISO,
        ...(after && { after }),
      }
    );
    const conn = data?.projects;
    if (!conn?.nodes) break;
    all.push(...conn.nodes);
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo?.endCursor ?? null;
  } while (after !== null);
  return all;
}

/** Same shape lib/summary.ts writes, so the UI reads backfilled weeks identically. */
function toPayloadFormat(projects: ProjectNode[]) {
  return projects.map((p) => {
    const scope = Math.round(p.scope ?? 0);
    return {
      identifier: "Project",
      title: p.name ?? "",
      project: p.name ?? null,
      url: p.url ?? null,
      completedAt: p.completedAt ?? null,
      state: p.status?.name ?? p.status?.type ?? null,
      description: p.description ?? null,
      startedAt: p.startedAt ?? p.startDate ?? null,
      targetDate: p.targetDate ?? null,
      lead: p.lead?.name ?? null,
      issue_count: scope,
      completed_issue_count: Math.round(scope * (p.progress ?? 0)),
    };
  });
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    console.error("Set LINEAR_API_KEY");
    process.exit(1);
  }

  const summariesDir = join(process.cwd(), "2026-weekly-work-summaries");
  const files = readdirSync(summariesDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();

  if (files.length === 0) {
    console.error("No weekly JSON files found");
    process.exit(1);
  }

  const headers = { Authorization: key, "Content-Type": "application/json" };
  const userData = await fetchLinearPage(headers, LINEAR_USER_QUERY, {});
  const userId = userData?.viewer?.id;
  if (!userId) throw new Error("No Linear user ID");
  console.error(
    `Linear user: ${userData?.viewer?.name ?? "?"} · ${files.length} weeks${dryRun ? " (dry run)" : ""}\n`
  );

  const weeksWithProjects: string[] = [];

  for (const file of files) {
    const path = join(summariesDir, file);
    const payload = JSON.parse(readFileSync(path, "utf8")) as Payload;
    const weekEnding = payload.meta?.week_ending ?? file.replace(".json", "");
    const windowStart = payload.meta?.window_start;
    const windowEnd = payload.meta?.window_end;

    if (!windowStart || !windowEnd) {
      console.error(`Skip ${file}: no window_start/window_end`);
      continue;
    }

    const projects = await fetchCompletedProjects(
      headers,
      userId,
      windowStart,
      windowEnd
    );
    const completedProjects = toPayloadFormat(projects);
    if (projects.length > 0) weeksWithProjects.push(weekEnding);

    const names = completedProjects.map((p) => p.title).join(", ");
    if (dryRun) {
      console.log(
        `${weekEnding}: ${projects.length} project(s)${names ? ` — ${names}` : ""}`
      );
      continue;
    }

    // Recomputed rather than incremented, so re-runs stay correct. Weeks parsed
    // from a video transcript carry a completed count with no issue list behind
    // it — for those, keep the recorded number instead of collapsing it to zero.
    const priorProjects = payload.stats.linear_projects_completed ?? 0;
    const issueBaseline =
      payload.linear.completed_issues.length > 0
        ? payload.linear.completed_issues.length
        : Math.max(0, (payload.stats.linear_completed ?? 0) - priorProjects);

    payload.linear.completed_projects = completedProjects;
    payload.stats.linear_projects_completed = completedProjects.length;
    payload.stats.linear_completed = issueBaseline + completedProjects.length;

    writeFileSync(path, JSON.stringify(payload, null, 2), "utf8");
    // Pair the .md with the .json by filename: a couple of files carry a
    // meta.week_ending that differs from their own name (2026-01-30.json says
    // 2026-01-31), and keying off meta would write to the wrong sibling.
    writeFileSync(
      path.replace(/\.json$/, ".md"),
      buildMarkdownSummary(payload),
      "utf8"
    );
    console.log(
      `Updated ${weekEnding}: ${projects.length} project(s)${names ? ` — ${names}` : ""}`
    );
  }

  console.error(
    `\nDone. Weeks with shipped projects: ${
      weeksWithProjects.length > 0 ? weeksWithProjects.join(", ") : "none"
    }`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
