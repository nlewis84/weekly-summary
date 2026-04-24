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
  md += `- Linear completed: ${stats.linear_completed} | Worked on: ${stats.linear_worked_on} | Created: ${stats.linear_issues_created ?? 0} | Replies: ${stats.linear_comments ?? 0}\n`;
  md += `- Repos: ${stats.repos.join(", ") || "—"}\n\n`;
  md += `## Linear — Completed\n\n`;
  for (const i of linear.completed_issues) {
    const id = (i.identifier as string) ?? "";
    const title = (i.title as string) ?? "";
    const project = (i.project as string) ?? "—";
    const completedAt = (i.completedAt as string) ?? "";
    md += `- **${id}** ${title} — ${project} ${completedAt ? `(${completedAt.slice(0, 10)})` : ""}\n`;
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
    md += `- [${pr.title}](${pr.url}) — ${pr.repo ?? ""} ${pr.merged_at ? pr.merged_at.slice(0, 10) : ""}\n`;
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
export function buildBasecampSummary(payload: Payload): string {
  const { linear, github } = payload;
  const sections: string[] = [];

  const mergedPrs = github.merged_prs ?? [];
  if (mergedPrs.length > 0) {
    sections.push(buildSection("PRs merged", mergedPrs.map((pr) => formatPrLine(pr.title, pr.repo, pr.url))));
  }

  const openPrs = github.open_prs ?? [];
  if (openPrs.length > 0) {
    sections.push(buildSection("PRs active", openPrs.map((pr) => formatPrLine(pr.title, pr.repo, pr.url))));
  }

  const reviews = github.reviews ?? [];
  if (reviews.length > 0) {
    sections.push(
      buildSection(
        "PR reviews",
        reviews.map((pr) => formatPrLine(pr.title, undefined, pr.url))
      )
    );
  }

  const completed = linear.completed_issues ?? [];
  if (completed.length > 0) {
    sections.push(buildSection("Linear done", completed.map(formatLinearLine)));
  }

  const workedOn = linear.worked_on_issues ?? [];
  if (workedOn.length > 0) {
    sections.push(buildSection("Linear active", workedOn.map(formatLinearLine)));
  }

  const created = linear.created_issues ?? [];
  if (created.length > 0) {
    sections.push(buildSection("Linear created", created.map(formatLinearLine)));
  }

  const body = sections.join("\n\n");
  return `Callouts for:\n\n${body}\n`;
}

function buildSection(heading: string, items: string[]): string {
  return [heading, ...items.map((item) => `- ${item}`)].join("\n");
}

function formatPrLine(
  title: string | undefined,
  repo: string | null | undefined,
  url: string | undefined
): string {
  const t = title ?? "";
  const linked = url ? `[${t}](${url})` : t;
  return repo ? `${linked}(${repo})` : linked;
}

function formatLinearLine(issue: Record<string, unknown>): string {
  const id = (issue.identifier as string) ?? "";
  const title = (issue.title as string) ?? "";
  const url = (issue.url as string) ?? "";
  const label = id ? `${id} ${title}` : title;
  return url ? `[${label}](${url})` : label;
}
