import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  GitHubGraphQLError,
  graphqlRequest,
  resetToleratedGaps,
  toleratedGapCount,
} from "./github-graphql";

function res(body: unknown) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => body,
  } as unknown as Response;
}

describe("graphqlRequest error tolerance", () => {
  beforeEach(() => resetToleratedGaps());
  afterEach(() => vi.unstubAllGlobals());

  it("throws on any error by default, so a mutation cannot fail silently", async () => {
    // createCommitOnBranch reports a refused commit exactly like this.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        res({
          data: { createCommitOnBranch: null },
          errors: [{ type: "NOT_FOUND", message: "No commit exists with..." }],
        })
      )
    );
    await expect(graphqlRequest("mutation {}", {}, {})).rejects.toThrow(
      GitHubGraphQLError
    );
  });

  it("tolerates NOT_FOUND for a batched read, but counts the gap", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        res({
          data: { p0: { pullRequest: {} }, p1: null },
          errors: [{ type: "NOT_FOUND", message: "Could not resolve to a Repository" }],
        })
      )
    );
    const out = await graphqlRequest<{ p0: unknown }>("query {}", {}, {}, {
      tolerateMissing: true,
    });
    expect(out.p0).toBeDefined();
    // The caller must be able to tell it was answered about fewer PRs.
    expect(toleratedGapCount()).toBe(1);
  });

  it("never tolerates FORBIDDEN, which is what throttling looks like", async () => {
    // Swallowing this is how an exhausted budget became commits_pushed: 0.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        res({
          data: { p0: null },
          errors: [{ type: "FORBIDDEN", message: "API rate limit exceeded" }],
        })
      )
    );
    await expect(
      graphqlRequest("query {}", {}, {}, { tolerateMissing: true })
    ).rejects.toThrow(/rate limit/i);
    expect(toleratedGapCount()).toBe(0);
  });

  it("throws when there is no data at all", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res({})));
    await expect(
      graphqlRequest("query {}", {}, {}, { tolerateMissing: true })
    ).rejects.toThrow(GitHubGraphQLError);
  });
});
