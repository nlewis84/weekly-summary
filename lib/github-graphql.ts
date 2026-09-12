/**
 * Batched PR activity over the GraphQL API.
 *
 * The REST shape of this data costs one request per PR per concern: a week with
 * 226 review candidates spent ~350 requests on `/pulls/:n/reviews`, ~220 on
 * `/issues/:n/timeline` and ~290 on `/issues/:n/comments`, which is most of a
 * 1,000-request page load and a fifth of the hourly budget. GraphQL answers the
 * same questions for 25 PRs in one request, so the same week costs ~20.
 *
 * Only the fan-out moves here. The candidate set still comes from the REST
 * search, and the in-window filtering still happens in `summary.ts` against the
 * same helpers, so the numbers are computed by the same logic as before.
 */

import { fetchWithRetry } from "./github-api.js";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

/**
 * Per-path NOT_FOUND errors this process has tolerated.
 *
 * Tolerating them keeps one deleted repo from discarding a batch of 25, but a
 * run that tolerated any of them is reporting on fewer PRs than it was asked
 * about. Callers compare this across a run to decide whether the numbers are
 * safe to report.
 */
let tolerated = 0;

export function toleratedGapCount(): number {
  return tolerated;
}

/** Test helper — module state outlives individual cases. */
export function resetToleratedGaps(): void {
  tolerated = 0;
}

/** Newline, for assembling multi-alias queries. */
const BR = "\n";

/**
 * PRs per request. GraphQL bills by nodes requested, so this is a trade between
 * request count and the cost of one query; 25 keeps a query well clear of both
 * the node ceiling and the ~1MB body limit.
 */
const PR_CHUNK = 25;

/** Queries in flight. GraphQL has its own secondary limit on concurrency. */
const QUERY_CONCURRENCY = 3;

/**
 * Per-connection page sizes. A PR that exceeds one of these is reported as
 * truncated and the caller re-reads that single PR over REST, so these are a
 * cost/coverage trade rather than a correctness limit.
 */
const REVIEW_PAGE = 100;
/**
 * Matches the `per_page=100` single page the REST path read. Some PRs carry
 * hundreds of bot-driven re-request events; neither path sees all of them, and
 * this only feeds the latency median, never a count.
 */
const REQUEST_PAGE = 100;
const COMMENT_PAGE = 100;

export class GitHubGraphQLError extends Error {
  constructor(message: string) {
    super(`GitHub GraphQL: ${message}`);
    this.name = "GitHubGraphQLError";
  }
}

export interface PrRef {
  owner: string;
  repo: string;
  number: number;
}

export interface PrActivity {
  reviews: Array<{ state: string; submittedAt: string | null }>;
  reviewRequests: Array<{ createdAt: string; login: string | null }>;
  comments: Array<{ createdAt: string; login: string | null }>;
  details: PrDetails | null;
  /**
   * Which connections hit their page size. Tracked per connection because the
   * consequences differ: a short `reviews` or `comments` page would understate
   * a count and has to be re-read over REST, while `reviewRequests` only feeds
   * a latency median and was already capped the same way over REST.
   */
  truncated: {
    reviews: boolean;
    reviewRequests: boolean;
    comments: boolean;
  };
}

export interface ActivityWants {
  reviews?: boolean;
  reviewRequests?: boolean;
  comments?: boolean;
  details?: boolean;
}

/**
 * The fields `/pulls/:number` was fetched one PR at a time for.
 *
 * `state` is normalised to REST's vocabulary — REST reports a merged PR as
 * `closed` with a `merged_at`, while GraphQL has a distinct `MERGED` state, and
 * the categorising downstream is written against the REST spelling.
 */
export interface PrDetails {
  merged_at: string | null;
  state: "open" | "closed";
  additions: number;
  deletions: number;
  changed_files: number;
}

export function prKey(ref: PrRef): string {
  return `${ref.owner}/${ref.repo}#${ref.number}`;
}

/** Accepts an html_url, an API pulls url, or an API issues url. */
export function parseAnyPrRef(url: string | null | undefined): PrRef | null {
  if (!url) return null;
  const html = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (html) {
    return { owner: html[1]!, repo: html[2]!, number: Number(html[3]) };
  }
  const api = url.match(
    /api\.github\.com\/repos\/([^/]+)\/([^/]+)\/(?:pulls|issues)\/(\d+)/
  );
  if (api) {
    return { owner: api[1]!, repo: api[2]!, number: Number(api[3]) };
  }
  return null;
}

function fragmentFor(wants: ActivityWants): string {
  const fields: string[] = [];
  if (wants.reviews) {
    // `author` filters server-side, so a PR with a hundred reviews by other
    // people still comes back small.
    fields.push(
      `reviews(first: ${REVIEW_PAGE}, author: $login) {
      nodes { state submittedAt }
      pageInfo { hasNextPage }
    }`
    );
  }
  if (wants.reviewRequests) {
    fields.push(
      `timelineItems(first: ${REQUEST_PAGE}, itemTypes: [REVIEW_REQUESTED_EVENT]) {
      nodes {
        ... on ReviewRequestedEvent {
          createdAt
          requestedReviewer { ... on User { login } }
        }
      }
      pageInfo { hasNextPage }
    }`
    );
  }
  if (wants.details) {
    fields.push(`mergedAt state additions deletions changedFiles`);
  }
  if (wants.comments) {
    fields.push(
      `comments(first: ${COMMENT_PAGE}) {
      nodes { createdAt author { login } }
      pageInfo { hasNextPage }
    }`
    );
  }
  if (fields.length === 0) {
    throw new GitHubGraphQLError("no activity requested");
  }
  return `fragment Activity on PullRequest {\n    ${fields.join("\n    ")}\n  }`;
}

function buildQuery(count: number, wants: ActivityWants): string {
  // Only the reviews selection filters by author, and GraphQL rejects a query
  // that declares a variable it never uses.
  const varDefs = wants.reviews ? ["$login: String!"] : [];
  const selections: string[] = [];
  for (let i = 0; i < count; i += 1) {
    varDefs.push(`$o${i}: String!`, `$r${i}: String!`, `$n${i}: Int!`);
    selections.push(
      `  p${i}: repository(owner: $o${i}, name: $r${i}) {
    pullRequest(number: $n${i}) { ...Activity }
  }`
    );
  }
  return `query(${varDefs.join(", ")}) {\n${selections.join("\n")}\n}\n\n${fragmentFor(wants)}`;
}

interface GqlPullRequest {
  reviews?: {
    nodes?: Array<{ state?: string; submittedAt?: string | null } | null>;
    pageInfo?: { hasNextPage?: boolean };
  };
  timelineItems?: {
    nodes?: Array<{
      createdAt?: string;
      requestedReviewer?: { login?: string } | null;
    } | null>;
    pageInfo?: { hasNextPage?: boolean };
  };
  comments?: {
    nodes?: Array<{
      createdAt?: string;
      author?: { login?: string } | null;
    } | null>;
    pageInfo?: { hasNextPage?: boolean };
  };
  mergedAt?: string | null;
  state?: string;
  additions?: number;
  deletions?: number;
  changedFiles?: number;
}

function toActivity(pr: GqlPullRequest): PrActivity {
  return {
    truncated: {
      reviews: pr.reviews?.pageInfo?.hasNextPage === true,
      reviewRequests: pr.timelineItems?.pageInfo?.hasNextPage === true,
      comments: pr.comments?.pageInfo?.hasNextPage === true,
    },
    reviews: (pr.reviews?.nodes ?? [])
      .filter((n): n is NonNullable<typeof n> => n != null)
      .map((n) => ({ state: n.state ?? "COMMENTED", submittedAt: n.submittedAt ?? null })),
    reviewRequests: (pr.timelineItems?.nodes ?? [])
      .filter((n): n is NonNullable<typeof n> => n != null && n.createdAt != null)
      .map((n) => ({
        createdAt: n.createdAt!,
        login: n.requestedReviewer?.login ?? null,
      })),
    comments: (pr.comments?.nodes ?? [])
      .filter((n): n is NonNullable<typeof n> => n != null && n.createdAt != null)
      .map((n) => ({ createdAt: n.createdAt!, login: n.author?.login ?? null })),
    details:
      pr.state == null
        ? null
        : {
            merged_at: pr.mergedAt ?? null,
            state: pr.state === "OPEN" ? "open" : "closed",
            additions: pr.additions ?? 0,
            deletions: pr.deletions ?? 0,
            changed_files: pr.changedFiles ?? 0,
          },
  };
}

export interface GraphQLOptions {
  /**
   * Treat per-path NOT_FOUND errors as "nothing there" instead of failing the
   * request.
   *
   * Only correct for the batched multi-alias reads, where one deleted or
   * private repo must not discard the other 24 answers — REST returned a 404
   * per PR and the callers already handle an absent entry. It is WRONG for
   * anything single-target and especially for a mutation: `createCommitOnBranch`
   * reports a rejected `expectedHeadOid` as NOT_FOUND with a null payload, and
   * tolerating that would report a save that never happened as a success.
   */
  tolerateMissing?: boolean;
}

export async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown>,
  headers: HeadersInit,
  options: GraphQLOptions = {}
): Promise<T> {
  const res = await fetchWithRetry(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: { ...(headers as Record<string, string>), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  }, { resource: "graphql" });

  if (!res.ok) {
    throw new GitHubGraphQLError(`HTTP ${res.status}`);
  }

  const body = (await res.json()) as {
    data?: T;
    errors?: Array<{ type?: string; message?: string }>;
  };

  if (body.errors?.length) {
    // FORBIDDEN deliberately is NOT tolerated: a throttled or permission-denied
    // path looks exactly like that, and swallowing it turned an exhausted
    // GraphQL budget into a summary reporting 0 commits and 21 merged PRs
    // instead of 140 and 50 — saved as fact, with no error shown.
    const allMissing = body.errors.every((e) => e.type === "NOT_FOUND");
    if (!body.data || !options.tolerateMissing || !allMissing) {
      throw new GitHubGraphQLError(
        body.errors.map((e) => e.message ?? e.type ?? "unknown").join("; ")
      );
    }
    tolerated += body.errors.length;
  }

  if (!body.data) throw new GitHubGraphQLError("empty response");
  return body.data;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]!);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

/**
 * Reviews, review requests and comments for many PRs, keyed by `prKey`.
 *
 * A PR that GitHub will not return (deleted, private, renamed away) is simply
 * absent from the map, which is how the REST path treated a failed fetch.
 */
export async function fetchPrActivity(
  refs: PrRef[],
  username: string,
  headers: HeadersInit,
  wants: ActivityWants
): Promise<Map<string, PrActivity>> {
  const unique = new Map<string, PrRef>();
  for (const ref of refs) {
    if (!Number.isFinite(ref.number)) continue;
    unique.set(prKey(ref), ref);
  }
  const list = [...unique.values()];
  const out = new Map<string, PrActivity>();
  if (list.length === 0) return out;

  const chunks: PrRef[][] = [];
  for (let i = 0; i < list.length; i += PR_CHUNK) {
    chunks.push(list.slice(i, i + PR_CHUNK));
  }

  const settled = await mapWithConcurrency(
    chunks,
    QUERY_CONCURRENCY,
    async (chunk) => {
      const query = buildQuery(chunk.length, wants);
      const variables: Record<string, unknown> = { login: username };
      chunk.forEach((ref, i) => {
        variables[`o${i}`] = ref.owner;
        variables[`r${i}`] = ref.repo;
        variables[`n${i}`] = ref.number;
      });
      const data = await graphqlRequest<
        Record<string, { pullRequest?: GqlPullRequest | null } | null>
      >(query, variables, headers, { tolerateMissing: true });
      return { chunk, data };
    }
  );

  for (const { chunk, data } of settled) {
    chunk.forEach((ref, i) => {
      const pr = data[`p${i}`]?.pullRequest;
      if (!pr) return;
      out.set(prKey(ref), toActivity(pr));
    });
  }
  return out;
}

/**
 * The node id for a login, which `history(author:)` needs.
 *
 * Cached for the life of the process: it is one extra round trip and the answer
 * cannot change.
 */
let userIdCache: { login: string; id: string | null } | null = null;

export async function fetchUserId(
  login: string,
  headers: HeadersInit
): Promise<string | null> {
  if (userIdCache?.login === login) return userIdCache.id;
  const data = await graphqlRequest<{ user?: { id?: string } | null }>(
    `query($login: String!) { user(login: $login) { id } }`,
    { login },
    headers
  );
  const id = data.user?.id ?? null;
  userIdCache = { login, id };
  return id;
}

export interface CommitNode {
  oid: string;
  committedDate: string | null;
  /**
   * The author date, which is what the REST path filtered PR commits on
   * (`commit.author.date`). It differs from committedDate on anything rebased,
   * so the two are not interchangeable for a window check.
   */
  authoredDate?: string | null;
  /** Only populated for PR commits, where the author still has to be matched. */
  login?: string | null;
  email?: string | null;
  name?: string | null;
}

/**
 * Commits by one author on each repo's default branch, within a window.
 *
 * Replaces a paginated `/repos/:owner/:repo/commits` request per repo.
 */
export async function fetchDefaultBranchCommits(
  owner: string,
  repos: string[],
  authorId: string,
  since: string,
  until: string,
  headers: HeadersInit
): Promise<Map<string, CommitNode[]>> {
  const out = new Map<string, CommitNode[]>();
  if (repos.length === 0) return out;

  const varDefs = [
    "$owner: String!",
    "$author: ID!",
    "$since: GitTimestamp!",
    "$until: GitTimestamp!",
    ...repos.map((_, i) => `$r${i}: String!`),
  ];
  const selections = repos.map(
    (_, i) => `  c${i}: repository(owner: $owner, name: $r${i}) {
    defaultBranchRef { target { ... on Commit {
      history(first: 100, author: { id: $author }, since: $since, until: $until) {
        nodes { oid committedDate }
        pageInfo { hasNextPage endCursor }
      }
    } } }
  }`
  );
  const variables: Record<string, unknown> = { owner, author: authorId, since, until };
  repos.forEach((repo, i) => {
    variables[`r${i}`] = repo;
  });

  type HistoryShape = {
    defaultBranchRef?: {
      target?: {
        history?: {
          nodes?: Array<{ oid?: string; committedDate?: string } | null>;
          pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
        };
      } | null;
    } | null;
  };

  const data = await graphqlRequest<Record<string, HistoryShape | null>>(
    `query(${varDefs.join(", ")}) {${BR}${selections.join(BR)}${BR}}`,
    variables,
    headers,
    { tolerateMissing: true }
  );

  for (let i = 0; i < repos.length; i += 1) {
    const repo = repos[i]!;
    const history = data[`c${i}`]?.defaultBranchRef?.target?.history;
    const collected: CommitNode[] = (history?.nodes ?? [])
      .filter((n): n is NonNullable<typeof n> => n != null && !!n.oid)
      .map((n) => ({ oid: n.oid!, committedDate: n.committedDate ?? null }));

    // A week with more than 100 commits on one default branch is rare but has
    // to page, or the count silently stops at 100.
    let cursor = history?.pageInfo?.hasNextPage ? history.pageInfo.endCursor : null;
    while (cursor) {
      const page = await graphqlRequest<{ repository?: HistoryShape | null }>(
        `query($owner: String!, $repo: String!, $author: ID!, $since: GitTimestamp!, $until: GitTimestamp!, $after: String!) {
          repository(owner: $owner, name: $repo) {
            defaultBranchRef { target { ... on Commit {
              history(first: 100, author: { id: $author }, since: $since, until: $until, after: $after) {
                nodes { oid committedDate }
                pageInfo { hasNextPage endCursor }
              }
            } } }
          }
        }`,
        { owner, repo, author: authorId, since, until, after: cursor },
        headers
      );
      const next = page.repository?.defaultBranchRef?.target?.history;
      for (const n of next?.nodes ?? []) {
        if (n?.oid) collected.push({ oid: n.oid, committedDate: n.committedDate ?? null });
      }
      cursor = next?.pageInfo?.hasNextPage ? (next.pageInfo.endCursor ?? null) : null;
    }

    out.set(repo, collected);
  }
  return out;
}

/**
 * Commits on each given PR, with enough author detail to match them the way the
 * REST path did (login, or the email/name containing the username).
 *
 * Replaces a paginated `/pulls/:number/commits` request per PR.
 */
export async function fetchPrCommits(
  refs: PrRef[],
  headers: HeadersInit
): Promise<Map<string, CommitNode[]>> {
  const out = new Map<string, CommitNode[]>();
  const unique = new Map<string, PrRef>();
  for (const ref of refs) {
    if (Number.isFinite(ref.number)) unique.set(prKey(ref), ref);
  }
  const list = [...unique.values()];
  if (list.length === 0) return out;

  const COMMIT_FIELDS = `nodes { commit { oid committedDate authoredDate author { user { login } email name } } }
        pageInfo { hasNextPage endCursor }`;

  type CommitsShape = {
    commits?: {
      nodes?: Array<{
        commit?: {
          oid?: string;
          committedDate?: string;
          authoredDate?: string;
          author?: {
            user?: { login?: string } | null;
            email?: string | null;
            name?: string | null;
          } | null;
        };
      } | null>;
      pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
    };
  };

  const flatten = (shape: CommitsShape | null | undefined): CommitNode[] =>
    (shape?.commits?.nodes ?? [])
      .map((n) => n?.commit)
      .filter((c): c is NonNullable<typeof c> => c != null && !!c.oid)
      .map((c) => ({
        oid: c.oid!,
        committedDate: c.committedDate ?? null,
        authoredDate: c.authoredDate ?? null,
        login: c.author?.user?.login ?? null,
        email: c.author?.email ?? null,
        name: c.author?.name ?? null,
      }));

  const chunks: PrRef[][] = [];
  for (let i = 0; i < list.length; i += PR_CHUNK) {
    chunks.push(list.slice(i, i + PR_CHUNK));
  }

  const settled = await mapWithConcurrency(
    chunks,
    QUERY_CONCURRENCY,
    async (chunk) => {
      const varDefs = chunk.flatMap((_, i) => [
        `$o${i}: String!`,
        `$r${i}: String!`,
        `$n${i}: Int!`,
      ]);
      const selections = chunk.map(
        (_, i) => `  p${i}: repository(owner: $o${i}, name: $r${i}) {
    pullRequest(number: $n${i}) { commits(first: 100) { ${COMMIT_FIELDS} } }
  }`
      );
      const variables: Record<string, unknown> = {};
      chunk.forEach((ref, i) => {
        variables[`o${i}`] = ref.owner;
        variables[`r${i}`] = ref.repo;
        variables[`n${i}`] = ref.number;
      });
      const data = await graphqlRequest<
        Record<string, { pullRequest?: CommitsShape | null } | null>
      >(`query(${varDefs.join(", ")}) {${BR}${selections.join(BR)}${BR}}`, variables, headers, {
        tolerateMissing: true,
      });
      return { chunk, data };
    }
  );

  const overflow: Array<{ ref: PrRef; cursor: string }> = [];
  for (const { chunk, data } of settled) {
    chunk.forEach((ref, i) => {
      const pr = data[`p${i}`]?.pullRequest;
      if (!pr) return;
      out.set(prKey(ref), flatten(pr));
      const info = pr.commits?.pageInfo;
      if (info?.hasNextPage && info.endCursor) {
        overflow.push({ ref, cursor: info.endCursor });
      }
    });
  }

  // PRs with more than 100 commits page individually; there are rarely any.
  for (const item of overflow) {
    let cursor: string | null = item.cursor;
    while (cursor) {
      const page: { repository?: { pullRequest?: CommitsShape | null } | null } =
        await graphqlRequest(
          `query($o: String!, $r: String!, $n: Int!, $after: String!) {
          repository(owner: $o, name: $r) {
            pullRequest(number: $n) { commits(first: 100, after: $after) { ${COMMIT_FIELDS} } }
          }
        }`,
          { o: item.ref.owner, r: item.ref.repo, n: item.ref.number, after: cursor },
          headers
        );
      const pr = page.repository?.pullRequest;
      const existing = out.get(prKey(item.ref)) ?? [];
      out.set(prKey(item.ref), [...existing, ...flatten(pr)]);
      const info = pr?.commits?.pageInfo;
      cursor = info?.hasNextPage ? (info.endCursor ?? null) : null;
    }
  }

  return out;
}
