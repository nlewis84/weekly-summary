/**
 * Markdown formatting for weekly summaries.
 * Client-safe (no node dependencies).
 */

import type { Payload } from "./types.js";

export function buildMarkdownSummary(payload: Payload): string {
  const { meta, stats, linear, github, check_ins, terminal_output } = payload;
  let md = `# Weekly Work Summary — ${meta.week_ending}\n\n`;
  md += `*Generated ${meta.generated_at} | Window: ${meta.window_start.slice(0, 10)} – ${meta.window_end.slice(0, 10)}*\n\n`;
  if (meta.source_of_truth) md += `## Source of truth\n\n${meta.source_of_truth}\n\n`;
  md += `## Stats\n\n`;
  md += `- PRs merged: ${stats.prs_merged} | Total PRs: ${stats.prs_total} | Reviews: ${stats.pr_reviews} | Comments: ${stats.pr_comments} | Commits: ${stats.commits_pushed ?? 0}\n`;
  md += `- Code volume: +${stats.lines_added ?? 0} / -${stats.lines_deleted ?? 0} | Files changed: ${stats.files_changed ?? 0}\n`;
  md += `- Median review latency (working hours): ${stats.median_review_latency_hours != null ? `${stats.median_review_latency_hours}h` : "—"}\n`;
  md += `- Linear completed: ${stats.linear_completed}${stats.linear_projects_completed ? ` (incl. ${stats.linear_projects_completed} project${stats.linear_projects_completed === 1 ? "" : "s"})` : ""} | Worked on: ${stats.linear_worked_on} | Created: ${stats.linear_issues_created ?? 0} | Replies: ${stats.linear_comments ?? 0}\n`;
  md += `- Repos: ${stats.repos.join(", ") || "—"}\n\n`;
  md += `## Linear — Completed\n\n`;
  for (const i of linear.completed_issues) {
    const id = (i.identifier as string) ?? "";
    const title = (i.title as string) ?? "";
    const project = (i.project as string) ?? "—";
    const completedAt = (i.completedAt as string) ?? "";
    md += `- **${id}** ${title} — ${project} ${completedAt ? `(${completedAt.slice(0, 10)})` : ""}\n`;
  }
  if ((linear.completed_projects?.length ?? 0) > 0) {
    md += `\n## Linear — Projects completed\n\n`;
    for (const p of linear.completed_projects ?? []) {
      const title = (p.title as string) ?? "";
      const completedAt = (p.completedAt as string) ?? "";
      md += `- **${title}**${completedAt ? ` (${completedAt.slice(0, 10)})` : ""}\n`;
    }
  }
  md += `\n## Linear — Worked on\n\n`;
  for (const i of linear.worked_on_issues) {
    const id = (i.identifier as string) ?? "";
    const title = (i.title as string) ?? "";
    md += `- ${id} ${title}\n`;
  }
  md += `\n## Linear — Created\n\n`;
  for (const i of linear.created_issues ?? []) {
    const id = (i.identifier as string) ?? "";
    const title = (i.title as string) ?? "";
    const createdAt = (i.createdAt as string) ?? "";
    md += `- **${id}** ${title}${createdAt ? ` (${createdAt.slice(0, 10)})` : ""}\n`;
  }
  md += `\n## Linear — Replies\n\n`;
  for (const i of linear.commented_issues ?? []) {
    const id = (i.identifier as string) ?? "";
    const title = (i.title as string) ?? "";
    md += `- ${id} ${title}\n`;
  }
  md += `\n## GitHub — Merged PRs\n\n`;
  for (const pr of github.merged_prs) {
    const vol =
      pr.additions != null || pr.deletions != null
        ? ` (+${pr.additions ?? 0}/-${pr.deletions ?? 0})`
        : "";
    md += `- [${pr.title}](${pr.url}) — ${pr.repo ?? ""} ${pr.merged_at ? pr.merged_at.slice(0, 10) : ""}${vol}\n`;
  }
  md += `\n## GitHub — Reviews\n\n`;
  for (const r of github.reviews ?? []) {
    const latency =
      r.latency_hours != null ? `${r.latency_hours}h` : "drive-by";
    md += `- [${r.title}](${r.url})${r.repo ? ` — ${r.repo}` : ""} (${latency})\n`;
  }
  md += `\n## Check-ins\n\n`;
  for (const e of check_ins ?? []) {
    md += `### ${e.day}\n\n${e.content}\n\n`;
  }
  md += `## Terminal output\n\n\`\`\`\n${terminal_output ?? ""}\n\`\`\`\n`;
  return md;
}

/**
 * Concise Basecamp-post format. Leaves a blank "Callouts for:" placeholder
 * at the top for manual edits (bullets + screenshot) before posting.
 *
 * Items are emitted as Markdown bullet lists with hyperlinks so Basecamp
 * renders each item on its own line and links out to the PR/issue.
 */
/**
 * The Basecamp check-in answer: one count per section, no item lists.
 *
 * Basecamp rejects an oversized answer with a bare "Unprocessable Entity", and
 * a busy week (≈200 reviews, ≈65 PRs, ≈170 Linear issues) ran to ~73k
 * characters against a ceiling nearer 58k — so the whole post failed rather
 * than arriving trimmed. The per-item detail lives in the summary committed to
 * GitHub, which has no such limit, and this stays a digest that fits.
 */
export function buildBasecampSummary(payload: Payload): string {
  const { linear, github } = payload;
  const sections: string[] = [];

  const addCount = (heading: string, line: string, count: number) => {
    if (count > 0) sections.push(buildSection(heading, [line]));
  };

  const merged = github.merged_prs ?? [];
  addCount("PRs merged", `Merged ${count(merged.length, "PR")}`, merged.length);

  const open = github.open_prs ?? [];
  addCount("PRs active", `${count(open.length, "PR")} still open`, open.length);

  const reviews = github.reviews ?? [];
  addCount(
    "PR reviews",
    `Reviewed ${count(reviews.length, "PR")}`,
    reviews.length
  );

  const completed = linear.completed_issues ?? [];
  addCount(
    "Linear done",
    `Completed ${count(completed.length, "issue")}`,
    completed.length
  );

  const workedOn = linear.worked_on_issues ?? [];
  addCount(
    "Linear active",
    `Worked on ${count(workedOn.length, "issue")}`,
    workedOn.length
  );

  const created = linear.created_issues ?? [];
  addCount(
    "Linear created",
    `Created ${count(created.length, "issue")}`,
    created.length
  );

  const body = sections.join("\n\n");
  return `Callouts for:\n\n${body}\n`;
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

function buildSection(heading: string, items: string[]): string {
  return [heading, ...items.map((item) => `- ${item}`)].join("\n");
}


