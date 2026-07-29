/**
 * Shared helpers for code volume and review latency metrics.
 */

export type TimelineEvent = {
  event?: string;
  created_at?: string;
  requested_reviewer?: { login?: string } | null;
};

/**
 * Hours from requested → reviewed. Returns null if either timestamp is missing
 * or reviewed is before requested.
 */
export function computeLatencyHours(
  requestedAt: string | null | undefined,
  reviewedAt: string | null | undefined
): number | null {
  if (!requestedAt || !reviewedAt) return null;
  const start = new Date(requestedAt).getTime();
  const end = new Date(reviewedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.round(((end - start) / 3_600_000) * 100) / 100;
}

/**
 * Median of a numeric list. Returns null for empty input.
 */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round(((sorted[mid - 1]! + sorted[mid]!) / 2) * 100) / 100;
  }
  return Math.round(sorted[mid]! * 100) / 100;
}

/**
 * Earliest review_requested for `username` that precedes `reviewedAt`.
 * Drive-by / never-requested → null.
 */
export function findRequestedAt(
  events: TimelineEvent[],
  username: string,
  reviewedAt: string | null | undefined
): string | null {
  if (!reviewedAt) return null;
  const reviewedMs = new Date(reviewedAt).getTime();
  if (!Number.isFinite(reviewedMs)) return null;

  let earliest: string | null = null;
  let earliestMs = Infinity;
  for (const ev of events) {
    if (ev.event !== "review_requested") continue;
    if (ev.requested_reviewer?.login !== username) continue;
    if (!ev.created_at) continue;
    const t = new Date(ev.created_at).getTime();
    if (!Number.isFinite(t) || t > reviewedMs) continue;
    if (t < earliestMs) {
      earliestMs = t;
      earliest = ev.created_at;
    }
  }
  return earliest;
}

export function sumVolume(
  prs: Array<{
    additions?: number | null;
    deletions?: number | null;
    changed_files?: number | null;
  }>
): { lines_added: number; lines_deleted: number; files_changed: number } {
  let lines_added = 0;
  let lines_deleted = 0;
  let files_changed = 0;
  for (const pr of prs) {
    lines_added += pr.additions ?? 0;
    lines_deleted += pr.deletions ?? 0;
    files_changed += pr.changed_files ?? 0;
  }
  return { lines_added, lines_deleted, files_changed };
}

/** Parse ApollosProject owner/repo/number from a PR html_url. */
export function parsePrRef(
  htmlUrl: string | null | undefined
): { owner: string; repo: string; number: number } | null {
  if (!htmlUrl) return null;
  const m = htmlUrl.match(
    /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!m) return null;
  return { owner: m[1]!, repo: m[2]!, number: Number(m[3]) };
}
