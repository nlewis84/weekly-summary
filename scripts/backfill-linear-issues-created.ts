#!/usr/bin/env -S npx tsx
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Backfill linear_issues_created for historical weekly summaries.
 * Fetches issues created by the viewer in each week's window from Linear API,
 * then updates the JSON files with stats.linear_issues_created and linear.created_issues.
 *
 * Usage: LINEAR_API_KEY=xxx npx tsx scripts/backfill-linear-issues-created.ts
 *        LINEAR_API_KEY=xxx npx tsx scripts/backfill-linear-issues-created.ts --dry-run
 */

const LINEAR_API_BASE = "https://api.linear.app/graphql";
const LINEAR_USER_QUERY = `
  query GetViewer {
    viewer { id name email }
  }
`;
const LINEAR_CREATED_QUERY = `
  query GetCreatedIssues($creatorId: ID!, $createdAfter: DateTimeOrDuration!, $createdBefore: DateTimeOrDuration!, $after: String) {
    issues(filter: { creator: { id: { eq: $creatorId } }, createdAt: { gte: $createdAfter, lte: $createdBefore } }, first: 100, after: $after) {
      nodes { id identifier title state { name type } url createdAt project { name } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

type CreatedIssue = {
  identifier?: string;
  title?: string;
  project?: { name?: string };
  url?: string;
  createdAt?: string | null;
  state?: { name?: string; type?: string };
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
    const msg = data?.errors ? JSON.stringify(data.errors) : data?.message ?? res.statusText;
    throw new Error(`Linear API ${res.status}: ${msg}`);
  }
  if (data.errors) {
    const msg = JSON.stringify(data.errors, null, 2);
    throw new Error(`Linear errors: ${msg}`);
  }
  return data.data;
}

async function fetchCreatedIssues(
  headers: Record<string, string>,
  userId: string,
  windowStartISO: string,
  windowEndISO: string
): Promise<CreatedIssue[]> {
  const all: CreatedIssue[] = [];
  let after: string | null = null;
  do {
    const vars: Record<string, unknown> = {
      creatorId: userId,
      createdAfter: windowStartISO,
      createdBefore: windowEndISO,
      ...(after && { after }),
    };

    const data = await fetchLinearPage(headers, LINEAR_CREATED_QUERY, vars);
    const conn = data?.issues;
    if (!conn?.nodes) break;
    all.push(...conn.nodes);
    if (!conn.pageInfo?.hasNextPage) break;
    after = conn.pageInfo?.endCursor ?? null;
  } while (after !== null);
  return all;
}

function toPayloadFormat(issues: CreatedIssue[]) {
  return issues.map((i) => ({
    identifier: i.identifier ?? "",
    title: i.title ?? "",
    project: i.project?.name ?? null,
    url: i.url ?? null,
    createdAt: i.createdAt ?? null,
    state: i.state?.name ?? i.state?.type ?? null,
  }));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const key = process.env.LINEAR_API_KEY;
  if (!key) {
    console.error("Set LINEAR_API_KEY");
    process.exit(1);
  }

  const summariesDir = join(process.cwd(), "2026-weekly-work-summaries");
  const { readdirSync } = await import("node:fs");
  const files = readdirSync(summariesDir)
    .filter((f) => f.endsWith(".json") && /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();

  if (files.length === 0) {
    console.error("No weekly JSON files found");
    process.exit(1);
  }

  const headers = { Authorization: key, "Content-Type": "application/json" };

  // Get viewer ID
  const userData = await fetchLinearPage(headers, LINEAR_USER_QUERY, {});
  const userId = userData?.viewer?.id;
  if (!userId) throw new Error("No Linear user ID");
  console.error(`Linear user: ${userData?.viewer?.name ?? "?"}\n`);

  for (const file of files) {
    const path = join(summariesDir, file);
    const raw = readFileSync(path, "utf8");
    const payload = JSON.parse(raw) as {
      meta?: { window_start?: string; window_end?: string; week_ending?: string };
      stats?: Record<string, unknown>;
      linear?: Record<string, unknown>;
    };

    const windowStart = payload.meta?.window_start;
    const windowEnd = payload.meta?.window_end;
    const weekEnding = payload.meta?.week_ending ?? file.replace(".json", "");

    if (!windowStart || !windowEnd) {
      console.error(`Skip ${file}: no window_start/window_end`);
      continue;
    }

    const issues = await fetchCreatedIssues(headers, userId, windowStart, windowEnd);
    const createdIssues = toPayloadFormat(issues);

    if (dryRun) {
      console.log(`${weekEnding}: ${issues.length} issues created`);
      continue;
    }

    const stats = payload.stats ?? {};
    stats.linear_issues_created = issues.length;

    const linear = payload.linear ?? {};
    linear.created_issues = createdIssues;

    writeFileSync(path, JSON.stringify({ ...payload, stats, linear }, null, 2), "utf8");
    console.log(`Updated ${file}: ${issues.length} issues created`);
  }

  console.error("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
