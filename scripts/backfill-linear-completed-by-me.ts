#!/usr/bin/env -S npx tsx
import "dotenv/config";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildMarkdownSummary } from "../lib/markdown";
import type { Payload } from "../lib/types";

/**
 * Backfill issues you moved to Done that historical summaries missed.
 *
 * Weekly summaries used to count only issues *assigned* to you, so closing out a
 * teammate's ticket never showed up. This finds those and appends them to
 * linear.completed_issues, then recomputes stats.linear_completed.
 *
 * Deliberately narrow: it does not re-run a whole summary. A full `pnpm cli
 * --week` re-run would rebuild check-ins from daily snapshots (which only start
 * 2026-03-27, so earlier weeks would lose theirs) and overwrite the video
 * transcript content on the January weeks.
 *
 * Re-runnable: appends only identifiers not already listed.
 *
 * Usage: npx tsx scripts/backfill-linear-completed-by-me.ts [--dry-run]
 */

const LINEAR_API_BASE = "https://api.linear.app/graphql";

const LINEAR_USER_QUERY = `
  query GetViewer {
    viewer { id name email }
  }
`;

// Mirrors LINEAR_COMPLETED_BY_ACTOR_QUERY in lib/summary.ts.
const LINEAR_WINDOW_COMPLETED_QUERY = `
  query GetWindowCompletedIssues($completedAfter: DateTimeOrDuration!, $completedBefore: DateTimeOrDuration!, $after: String) {
    issues(filter: { completedAt: { gte: $completedAfter, lte: $completedBefore } }, first: 50, after: $after) {
      nodes {
        id identifier title state { name type } url completedAt project { name }
        assignee { id }
        history(first: 20) { nodes { createdAt actor { id } toState { type } } }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type IssueNode = {
  id?: string;
  identifier?: string;
  title?: string;
  url?: string | null;
  completedAt?: string | null;
  state?: { name?: string; type?: string } | null;
  project?: { name?: string } | null;
  assignee?: { id?: string } | null;
  history?: {
    nodes?: Array<{
      createdAt?: string;
      actor?: { id?: string } | null;
      toState?: { type?: string } | null;
    }>;
  };
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

async function fetchWindowCompleted(
  headers: Record<string, string>,
  windowStartISO: string,
  windowEndISO: string
): Promise<IssueNode[]> {
  const all: IssueNode[] = [];
  let after: string | null = null;
  do {
    const data = await fetchLinearPage(headers, LINEAR_WINDOW_COMPLETED_QUERY, {
      completedAfter: windowStartISO,
      completedBefore: windowEndISO,
      ...(after && { after }),
    });
    const conn = data?.issues;
    if (!conn?.nodes) break;
    all.push(...conn.nodes);
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo?.endCursor ?? null;
  } while (after !== null);
  return all;
}

/** Actor on the issue's most recent move into a completed state, if it landed in the window. */
function completedByActorId(
  issue: IssueNode,
  windowStart: Date,
  windowEnd: Date
): string | null {
  const entry = (issue.history?.nodes ?? []).find(
    (h) => h.toState?.type === "completed"
  );
  if (!entry?.createdAt || !entry.actor?.id) return null;
  const at = new Date(entry.createdAt);
  if (at < windowStart || at > windowEnd) return null;
  return entry.actor.id;
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

  const headers = { Authorization: key, "Content-Type": "application/json" };
  const userData = await fetchLinearPage(headers, LINEAR_USER_QUERY, {});
  const userId = userData?.viewer?.id;
  if (!userId) throw new Error("No Linear user ID");
  console.error(
    `Linear user: ${userData?.viewer?.name ?? "?"} · ${files.length} weeks${dryRun ? " (dry run)" : ""}\n`
  );

  let added = 0;
  const skipped: string[] = [];

  for (const file of files) {
    const path = join(summariesDir, file);
    const payload = JSON.parse(readFileSync(path, "utf8")) as Payload;
    const weekEnding = payload.meta?.week_ending ?? file.replace(".json", "");
    const windowStartISO = payload.meta?.window_start;
    const windowEndISO = payload.meta?.window_end;

    if (!windowStartISO || !windowEndISO) {
      console.error(`Skip ${weekEnding}: no window_start/window_end`);
      continue;
    }

    // Transcript weeks record a count with no issue list behind it; there is no
    // way to merge a list into a number without double-counting, so leave them.
    if (
      payload.linear.completed_issues.length === 0 &&
      (payload.stats.linear_completed ?? 0) > 0
    ) {
      skipped.push(weekEnding);
      console.error(
        `Skip ${weekEnding}: count of ${payload.stats.linear_completed} has no issue list (transcript week)`
      );
      continue;
    }

    const windowStart = new Date(windowStartISO);
    const windowEnd = new Date(windowEndISO);
    const candidates = await fetchWindowCompleted(
      headers,
      windowStartISO,
      windowEndISO
    );

    const known = new Set(
      payload.linear.completed_issues
        .map((i) => i.identifier as string)
        .filter(Boolean)
    );
    const missing = candidates
      .filter((issue) => {
        if (!issue.identifier || known.has(issue.identifier)) return false;
        return completedByActorId(issue, windowStart, windowEnd) === userId;
      })
      .map((i) => ({
        identifier: i.identifier ?? "",
        title: i.title ?? "",
        project: i.project?.name ?? null,
        url: i.url ?? null,
        completedAt: i.completedAt ?? null,
        state: i.state?.name ?? i.state?.type ?? null,
      }));

    if (missing.length === 0) continue;
    added += missing.length;

    const names = missing.map((m) => m.identifier).join(", ");
    if (dryRun) {
      console.log(`${weekEnding}: +${missing.length} — ${names}`);
      continue;
    }

    payload.linear.completed_issues = [
      ...payload.linear.completed_issues,
      ...missing,
    ];
    payload.stats.linear_completed =
      payload.linear.completed_issues.length +
      (payload.stats.linear_projects_completed ?? 0);

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
      `Updated ${weekEnding}: +${missing.length} — ${names} (now ${payload.stats.linear_completed})`
    );
  }

  console.error(
    `\nDone. ${added} issue(s) added${
      skipped.length > 0
        ? `; skipped transcript weeks: ${skipped.join(", ")}`
        : ""
    }`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
