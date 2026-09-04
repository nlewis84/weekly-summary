import { describe, it, expect } from "vitest";
import { rateLimitWaitMs } from "./github-api";

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
