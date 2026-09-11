/**
 * Persist weekly summary to the GitHub repo.
 *
 * Primary path is a single `createCommitOnBranch` mutation, which draws on the
 * GraphQL budget rather than core. That matters because the rest of a weekly
 * run is now GraphQL too: a spent core budget used to leave the summary built
 * but unsaveable, failing on four contents-API requests after all the real work
 * had already succeeded. It also writes both files in one commit instead of
 * two, so a saved week is never half-written.
 *
 * The REST contents API is kept as a fallback for anything the mutation cannot
 * do (a token without `contents: write`, say).
 */

import type { Payload } from "./types.js";
import { buildMarkdownSummary } from "./markdown.js";
import { fetchWithRetry } from "./github-api.js";
import { GitHubGraphQLError, graphqlRequest } from "./github-graphql.js";

const GITHUB_API = "https://api.github.com";

async function putFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string
): Promise<void> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`;
  const body: { message: string; content: string; sha?: string } = {
    message,
    content: Buffer.from(content, "utf8").toString("base64"),
  };

  const existing = await fetchWithRetry(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (existing.ok) {
    const data = (await existing.json()) as { sha?: string };
    if (data.sha) body.sha = data.sha;
  }

  const res = await fetchWithRetry(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `GitHub API: ${res.status}`);
  }
}

interface FileAddition {
  path: string;
  contents: string;
}

/**
 * Commit several files at once on the default branch.
 *
 * `expectedHeadOid` makes this a compare-and-set: if the branch moved between
 * reading the head and committing, GitHub rejects it rather than clobbering,
 * and one retry picks up the new head.
 */
async function commitViaGraphQL(
  token: string,
  owner: string,
  repo: string,
  additions: FileAddition[],
  headline: string
): Promise<void> {
  const headers = { Authorization: `Bearer ${token}` };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const info = await graphqlRequest<{
      repository?: {
        defaultBranchRef?: { name?: string; target?: { oid?: string } } | null;
      } | null;
    }>(
      `query($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          defaultBranchRef { name target { oid } }
        }
      }`,
      { owner, repo },
      headers
    );

    const branch = info.repository?.defaultBranchRef;
    const oid = branch?.target?.oid;
    if (!branch?.name || !oid) {
      throw new GitHubGraphQLError(
        `no default branch for ${owner}/${repo}`
      );
    }

    try {
      const result = await graphqlRequest<{
        createCommitOnBranch?: { commit?: { oid?: string } | null } | null;
      }>(
        `mutation($input: CreateCommitOnBranchInput!) {
          createCommitOnBranch(input: $input) { commit { oid } }
        }`,
        {
          input: {
            branch: {
              repositoryNameWithOwner: `${owner}/${repo}`,
              branchName: branch.name,
            },
            expectedHeadOid: oid,
            message: { headline },
            fileChanges: {
              additions: additions.map((a) => ({
                path: a.path,
                contents: Buffer.from(a.contents, "utf8").toString("base64"),
              })),
            },
          },
        },
        headers
      );
      // Do not take silence for success: a refused mutation can come back with
      // a null payload, and a save that wrote nothing must not report as saved.
      if (!result.createCommitOnBranch?.commit?.oid) {
        throw new GitHubGraphQLError(
          "createCommitOnBranch returned no commit"
        );
      }
      return;
    } catch (err) {
      // A moved head is the one failure worth retrying; anything else is real.
      // GitHub words it "No commit exists with specified expectedHeadOid".
      const stale =
        err instanceof GitHubGraphQLError &&
        /expectedheadoid|stale|not a fast forward|head of the branch/i.test(
          err.message
        );
      if (!stale || attempt === 1) throw err;
    }
  }
}

export async function saveSummaryToGitHub(
  payload: Payload,
  repoSpec: string
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN required for GitHub persist");

  const [owner, repo] = repoSpec.split("/");
  if (!owner || !repo) throw new Error("GITHUB_REPO must be owner/repo");

  const weekEnding = payload.meta.week_ending;
  const basePath = "2026-weekly-work-summaries";
  const json = JSON.stringify(payload, null, 2);
  const markdown = buildMarkdownSummary(payload);

  try {
    await commitViaGraphQL(
      token,
      owner,
      repo,
      [
        { path: `${basePath}/${weekEnding}.json`, contents: json },
        { path: `${basePath}/${weekEnding}.md`, contents: markdown },
      ],
      `Save weekly summary ${weekEnding}`
    );
    return;
  } catch (err) {
    if (!(err instanceof GitHubGraphQLError)) throw err;
    console.error(
      `GraphQL commit failed (${err.message}); falling back to the contents API`
    );
  }

  await putFile(
    token,
    owner,
    repo,
    `${basePath}/${weekEnding}.json`,
    json,
    `Save weekly summary ${weekEnding}`
  );

  await putFile(
    token,
    owner,
    repo,
    `${basePath}/${weekEnding}.md`,
    markdown,
    `Save weekly summary ${weekEnding} (md)`
  );
}
