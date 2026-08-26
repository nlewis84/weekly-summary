import { describe, it, expect, beforeEach } from "vitest";
import {
  SearchBudgetError,
  peekSearchBudget,
  recordSearchResponse,
  refreshSearchBudget,
  resetSearchBudget,
  searchRequest,
} from "./github-search";

const HEADERS = { Authorization: "Bearer t" };

function res(
  status: number,
  headers: Record<string, string> = {},
  body: unknown = { items: [] }
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
    json: async () => body,
  } as unknown as Response;
}

/** A fetch stub that answers /rate_limit and counts real search calls. */
function stub({
  remaining,
  resetInSeconds = 60,
  searchStatus = 200,
}: {
  remaining: number;
  resetInSeconds?: number;
  searchStatus?: number;
}) {
  const reset = Math.floor(Date.now() / 1000) + resetInSeconds;
  let searches = 0;
  let rateLimitCalls = 0;
  const fetchImpl = (async (url: string) => {
    if (String(url).includes("/rate_limit")) {
      rateLimitCalls += 1;
      return res(200, {}, { resources: { search: { limit: 30, remaining, reset } } });
    }
    searches += 1;
    return res(searchStatus, {
      "x-ratelimit-limit": "30",
      "x-ratelimit-remaining": String(Math.max(0, remaining - searches)),
      "x-ratelimit-reset": String(reset),
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, searches: () => searches, rateLimitCalls: () => rateLimitCalls };
}

beforeEach(() => resetSearchBudget());

describe("budget tracking", () => {
  it("reads the budget from response headers", () => {
    const reset = Math.floor(Date.now() / 1000) + 30;
    recordSearchResponse(
      res(200, {
        "x-ratelimit-limit": "30",
        "x-ratelimit-remaining": "17",
        "x-ratelimit-reset": String(reset),
      })
    );
    expect(peekSearchBudget()).toMatchObject({ limit: 30, remaining: 17 });
  });

  it("seeds from /rate_limit, which costs nothing", async () => {
    const s = stub({ remaining: 25 });
    await refreshSearchBudget(HEADERS, s.fetchImpl);
    expect(peekSearchBudget()?.remaining).toBe(25);
    expect(s.searches()).toBe(0);
  });
});

describe("searchRequest", () => {
  it("spends budget and tracks what is left", async () => {
    const s = stub({ remaining: 25 });
    await searchRequest("https://api.github.com/search/issues?q=x", HEADERS, {
      priority: "high",
      fetchImpl: s.fetchImpl,
    });
    expect(s.searches()).toBe(1);
    expect(peekSearchBudget()!.remaining).toBeLessThan(25);
  });

  it("refuses without contacting GitHub when the reserve would be breached", async () => {
    const s = stub({ remaining: 5 });
    await expect(
      searchRequest("https://api.github.com/search/issues?q=x", HEADERS, {
        priority: "low",
        fetchImpl: s.fetchImpl,
      })
    ).rejects.toBeInstanceOf(SearchBudgetError);
    // The whole point: no request was made to find this out.
    expect(s.searches()).toBe(0);
  });

  it("lets high priority through where low is refused", async () => {
    const s = stub({ remaining: 5 });
    await searchRequest("https://api.github.com/search/issues?q=x", HEADERS, {
      priority: "high",
      fetchImpl: s.fetchImpl,
    });
    expect(s.searches()).toBe(1);
  });

  it("stops a burst once the budget drains, instead of firing all of them", async () => {
    const s = stub({ remaining: 14 });
    const attempts = Array.from({ length: 12 }, () =>
      searchRequest("https://api.github.com/search/issues?q=x", HEADERS, {
        priority: "low",
        fetchImpl: s.fetchImpl,
      }).then(
        () => "ok",
        (e) => (e instanceof SearchBudgetError ? "refused" : "error")
      )
    );
    const outcomes = await Promise.all(attempts);
    // Reserve for "low" is 10, so only the first few may spend.
    expect(outcomes.filter((o) => o === "ok").length).toBe(4);
    expect(outcomes.filter((o) => o === "refused").length).toBe(8);
    expect(s.searches()).toBe(4);
  });

  it("marks the budget spent when GitHub returns 403", async () => {
    const s = stub({ remaining: 25, searchStatus: 403 });
    await expect(
      searchRequest("https://api.github.com/search/issues?q=x", HEADERS, {
        priority: "high",
        fetchImpl: s.fetchImpl,
      })
    ).rejects.toBeInstanceOf(SearchBudgetError);
    expect(peekSearchBudget()!.remaining).toBe(0);

    // And the next caller is refused locally rather than repeating the 403.
    await expect(
      searchRequest("https://api.github.com/search/issues?q=x", HEADERS, {
        priority: "high",
        fetchImpl: s.fetchImpl,
      })
    ).rejects.toBeInstanceOf(SearchBudgetError);
    expect(s.searches()).toBe(1);
  });

  it("only asks /rate_limit once for a burst", async () => {
    const s = stub({ remaining: 25 });
    await Promise.all(
      Array.from({ length: 5 }, () =>
        searchRequest("https://api.github.com/search/issues?q=x", HEADERS, {
          priority: "high",
          fetchImpl: s.fetchImpl,
        })
      )
    );
    expect(s.rateLimitCalls()).toBe(1);
  });
});
