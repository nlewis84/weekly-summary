import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseCheckIns,
  getWindowStart,
  getWindowEnd,
  runSummary,
} from "./summary";

describe("parseCheckIns", () => {
  it("returns empty array for empty input", () => {
    expect(parseCheckIns("")).toEqual([]);
    expect(parseCheckIns("   \n  ")).toEqual([]);
  });

  it("parses day headers with content", () => {
    const input = `Monday
PR reviews
Worked on Giving module

Tuesday
Dec 9
Removed some tabs`;
    const result = parseCheckIns(input);
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0]).toHaveProperty("day");
    expect(result[0]).toHaveProperty("content");
  });

  it("parses Monday: format", () => {
    const input = "Monday: Did PR reviews and worked on X";
    const result = parseCheckIns(input);
    expect(result.length).toBe(1);
    expect(result[0].day).toBe("Monday");
    expect(result[0].content).toContain("Did PR reviews");
  });

  it("returns single Check-ins entry when no day headers", () => {
    const input = "Some random notes without day headers";
    const result = parseCheckIns(input);
    expect(result.length).toBe(1);
    expect(result[0].day).toBe("Check-ins");
    expect(result[0].content).toBe("Some random notes without day headers");
  });
});

describe("getWindowStart", () => {
  it("returns midnight today for todayMode", () => {
    const now = new Date(2026, 1, 5, 14, 30, 0);
    const start = getWindowStart(now, true);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(1);
    expect(start.getDate()).toBe(5);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });

  it("returns previous Saturday 00:00 for weekly mode", () => {
    const friday = new Date(2026, 1, 6, 12, 0, 0);
    const start = getWindowStart(friday, false);
    expect(start.getDay()).toBe(6);
    expect(start.getDate()).toBe(31);
    expect(start.getMonth()).toBe(0);
  });

  it("returns midnight yesterday for yesterdayMode", () => {
    const now = new Date(2026, 1, 5, 14, 30, 0);
    const start = getWindowStart(now, false, true);
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(1);
    expect(start.getDate()).toBe(4);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
  });
});

describe("getWindowEnd", () => {
  it("returns end of given day", () => {
    const now = new Date(2026, 1, 5, 14, 0, 0);
    const end = getWindowEnd(now);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(1);
    expect(end.getDate()).toBe(5);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });

  it("returns end of yesterday for yesterdayMode", () => {
    const now = new Date(2026, 1, 5, 14, 0, 0);
    const end = getWindowEnd(now, false, true);
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(1);
    expect(end.getDate()).toBe(4);
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
  });
});

describe("runSummary", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("linear.app")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const isViewer = String(body.query || "").includes("GetViewer");
          return new Response(
            JSON.stringify({
              data: isViewer
                ? { viewer: { id: "user-1", name: "Test User" } }
                : { issues: { nodes: [], pageInfo: { hasNextPage: false } } },
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
        if (url.includes("github.com")) {
          if (url.includes("/events")) {
            return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
          }
          return new Response(
            JSON.stringify({ items: [], total_count: 0 }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response("{}", { headers: { "Content-Type": "application/json" } });
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns payload with stats shape when APIs return empty", async () => {
    process.env.LINEAR_API_KEY = "lin_test";
    process.env.GITHUB_TOKEN = "ghp_test";
    process.env.GITHUB_USERNAME = "testuser";

    const result = await runSummary({
      todayMode: true,
      checkInsText: "",
      outputDir: null,
    });

    expect(result.payload).toBeDefined();
    expect(result.payload.stats).toMatchObject({
      prs_merged: expect.any(Number),
      prs_total: expect.any(Number),
      pr_reviews: expect.any(Number),
      commits_pushed: expect.any(Number),
      linear_completed: expect.any(Number),
      linear_worked_on: expect.any(Number),
      linear_issues_created: expect.any(Number),
      repos: expect.any(Array),
    });
    expect(result.terminalOutput).toBeDefined();
  });
});
