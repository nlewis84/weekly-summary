import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  RateLimitExhaustedError,
  fetchWithRetry,
  peekCoreBudget,
  rateLimitWaitMs,
  recordCoreResponse,
  resetCoreBudget,
} from "./github-api";

function hdrs(map: Record<string, string>) {
  return { get: (n: string) => map[n.toLowerCase()] ?? null };
}

describe("rateLimitWaitMs", () => {
  const NOW = 1_700_000_000_000;

  it("prefers retry-after, which is what a secondary limit sends", () => {
    expect(
      rateLimitWaitMs(hdrs({ "retry-after": "45" }), NOW)
    ).toBe(45_000);
  });

  it("does not treat the hourly reset as the wait on a secondary limit", () => {
    // remaining is untouched, so the primary budget is fine and the hour-away
    // reset says nothing about how long this burst limit lasts.
    const wait = rateLimitWaitMs(
      hdrs({
        "x-ratelimit-remaining": "4998",
        "x-ratelimit-reset": String(Math.floor(NOW / 1000) + 3600),
      }),
      NOW
    );
    expect(wait).toBe(60_000);
  });

  it("waits for the reset when the primary budget is actually spent", () => {
    const wait = rateLimitWaitMs(
      hdrs({
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.floor(NOW / 1000) + 50),
      }),
      NOW
    );
    expect(wait).toBe(50_000);
  });

  it("caps the wait so one bad header cannot stall a run for an hour", () => {
    const wait = rateLimitWaitMs(
      hdrs({
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.floor(NOW / 1000) + 3600),
      }),
      NOW
    );
    expect(wait).toBe(90_000);
  });
});

function res(status: number, map: Record<string, string>) {
  return { status, headers: hdrs(map) } as unknown as Response;
}

describe("core budget tracking", () => {
  beforeEach(() => resetCoreBudget());
  afterEach(() => vi.unstubAllGlobals());

  it("records the primary budget from response headers", () => {
    recordCoreResponse(
      hdrs({
        "x-ratelimit-resource": "core",
        "x-ratelimit-limit": "5000",
        "x-ratelimit-remaining": "1319",
        "x-ratelimit-used": "3681",
        "x-ratelimit-reset": "1700000000",
      })
    );
    expect(peekCoreBudget()).toMatchObject({ remaining: 1319, used: 3681 });
  });

  it("ignores search headers, which run on their own budget", () => {
    recordCoreResponse(
      hdrs({ "x-ratelimit-resource": "search", "x-ratelimit-remaining": "0" })
    );
    expect(peekCoreBudget()).toBeNull();
  });

  it("fails the run instead of sleeping when the hour is spent", async () => {
    const reset = Math.floor(Date.now() / 1000) + 1800;
    const fetchMock = vi.fn().mockResolvedValue(
      res(403, {
        "x-ratelimit-resource": "core",
        "x-ratelimit-limit": "5000",
        "x-ratelimit-remaining": "0",
        "x-ratelimit-used": "5000",
        "x-ratelimit-reset": String(reset),
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithRetry("https://api.github.com/x", {})).rejects.toThrow(
      RateLimitExhaustedError
    );
    // One attempt, no MAX_RETRIES of 90s naps.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refuses without a round trip once exhaustion is known", async () => {
    recordCoreResponse(
      hdrs({
        "x-ratelimit-resource": "core",
        "x-ratelimit-limit": "5000",
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 600),
      })
    );
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithRetry("https://api.github.com/x", {})).rejects.toThrow(
      /budget exhausted/
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not let a spent core budget block a GraphQL query", async () => {
    // The batched reads exist to survive exactly this: core gone, GraphQL fine.
    recordCoreResponse(
      hdrs({
        "x-ratelimit-resource": "core",
        "x-ratelimit-limit": "5000",
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 600),
      })
    );
    const fetchMock = vi
      .fn()
      .mockResolvedValue(res(200, { "x-ratelimit-resource": "graphql", "x-ratelimit-remaining": "4900" }));
    vi.stubGlobal("fetch", fetchMock);

    const out = await fetchWithRetry(
      "https://api.github.com/graphql",
      {},
      { resource: "graphql" }
    );
    expect(out.status).toBe(200);

    // ...and core is still refused.
    await expect(fetchWithRetry("https://api.github.com/x", {})).rejects.toThrow(
      /budget exhausted/
    );
  });

  it("still retries a secondary limit, which is transient", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(res(403, { "retry-after": "0" }))
      .mockResolvedValueOnce(res(200, { "x-ratelimit-remaining": "4000" }));
    vi.stubGlobal("fetch", fetchMock);

    const out = await fetchWithRetry("https://api.github.com/x", {});
    expect(out.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
