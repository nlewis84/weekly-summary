import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseCheckIns,
  getWindowStart,
  getWindowEnd,
  getWindowForWeekEnding,
  isDeliveredProject,
  resolveTodayWindow,
  runSummary,
} from "./summary";
import * as dailySnapshot from "./daily-snapshot";

describe("isDeliveredProject", () => {
  it("counts a project whose status means done", () => {
    expect(
      isDeliveredProject({ status: { name: "Complete", type: "completed" } })
    ).toBe(true);
  });

  it("rejects completed-type statuses that mean it never shipped", () => {
    // Linear types "Incomplete" as completed, so completedAt is set regardless.
    expect(
      isDeliveredProject({ status: { name: "Incomplete", type: "completed" } })
    ).toBe(false);
    expect(
      isDeliveredProject({ status: { name: "Canceled", type: "canceled" } })
    ).toBe(false);
  });

  it("rejects projects still in flight", () => {
    expect(
      isDeliveredProject({
        status: { name: "In Development", type: "started" },
      })
    ).toBe(false);
  });

  it("falls back to completedAt when the workspace has no status vocabulary", () => {
    expect(isDeliveredProject({})).toBe(true);
    expect(isDeliveredProject({ status: null })).toBe(true);
  });
});

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
  it("returns now for todayMode (open capture period)", () => {
    const now = new Date(2026, 1, 5, 14, 0, 0);
    const end = getWindowEnd(now, true);
    expect(end.getTime()).toBe(now.getTime());
  });

  it("returns end of given day for weekly mode", () => {
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

describe("resolveTodayWindow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to local midnight when there is no prior capture", () => {
    vi.spyOn(dailySnapshot, "getMostRecentSnapshot").mockReturnValue(null);
    const now = new Date(2026, 7, 12, 16, 0, 0);
    const { windowStart, windowEnd } = resolveTodayWindow(now);
    expect(windowStart.getTime()).toBe(
      new Date(2026, 7, 12, 0, 0, 0, 0).getTime()
    );
    expect(windowEnd.getTime()).toBe(now.getTime());
  });

  it("starts live Today at the most recent capture", () => {
    const capturedAt = new Date(2026, 7, 11, 15, 19, 0);
    vi.spyOn(dailySnapshot, "getMostRecentSnapshot").mockReturnValue({
      date: "2026-08-11",
      capturedAt,
      payload: {
        meta: { generated_at: capturedAt.toISOString() },
      },
    } as dailySnapshot.RecentSnapshot);
    const now = new Date(2026, 7, 12, 16, 0, 0);
    const { windowStart, windowEnd } = resolveTodayWindow(now);
    expect(windowStart.getTime()).toBe(capturedAt.getTime());
    expect(windowEnd.getTime()).toBe(now.getTime());
  });

  it("for capture, starts at the previous day's capture even if today was already captured", () => {
    const prevCapture = new Date(2026, 7, 11, 15, 19, 0);
    vi.spyOn(dailySnapshot, "getMostRecentSnapshot").mockImplementation(
      (beforeDate?: string) => {
        if (beforeDate === "2026-08-12") {
          return {
            date: "2026-08-11",
            capturedAt: prevCapture,
            payload: { meta: { generated_at: prevCapture.toISOString() } },
          } as dailySnapshot.RecentSnapshot;
        }
        return {
          date: "2026-08-12",
          capturedAt: new Date(2026, 7, 12, 15, 58, 0),
          payload: {
            meta: {
              generated_at: new Date(2026, 7, 12, 15, 58, 0).toISOString(),
            },
          },
        } as dailySnapshot.RecentSnapshot;
      }
    );
    const now = new Date(2026, 7, 12, 16, 5, 0);
    const { windowStart } = resolveTodayWindow(now, { forCapture: true });
    expect(windowStart.getTime()).toBe(prevCapture.getTime());
  });
});

describe("getWindowForWeekEnding", () => {
  it("returns Sat–Fri window for a Friday week-ending", () => {
    const { windowStart, windowEnd } = getWindowForWeekEnding("2026-07-03");
    expect(windowStart.getFullYear()).toBe(2026);
    expect(windowStart.getMonth()).toBe(5);
    expect(windowStart.getDate()).toBe(27);
    expect(windowStart.getDay()).toBe(6);
    expect(windowStart.getHours()).toBe(0);
    expect(windowEnd.getFullYear()).toBe(2026);
    expect(windowEnd.getMonth()).toBe(6);
    expect(windowEnd.getDate()).toBe(3);
    expect(windowEnd.getDay()).toBe(5);
    expect(windowEnd.getHours()).toBe(23);
  });

  it("rejects non-Friday dates", () => {
    expect(() => getWindowForWeekEnding("2026-06-29")).toThrow(/Friday/);
  });

  it("rejects invalid format", () => {
    expect(() => getWindowForWeekEnding("07-03-2026")).toThrow(/YYYY-MM-DD/);
  });
});

describe("runSummary", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("linear.app")) {
          const body = init?.body ? JSON.parse(init.body as string) : {};
          const queryStr = String(body.query || "");
          const isViewer = queryStr.includes("GetViewer");
          const isComments = queryStr.includes("GetUserComments");
          return new Response(
            JSON.stringify({
              data: isViewer
                ? { viewer: { id: "user-1", name: "Test User" } }
                : isComments
                  ? {
                      comments: { nodes: [], pageInfo: { hasNextPage: false } },
                    }
                  : { issues: { nodes: [], pageInfo: { hasNextPage: false } } },
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
        if (url.includes("github.com")) {
          if (url.includes("/events")) {
            return new Response(JSON.stringify([]), {
              headers: { "Content-Type": "application/json" },
            });
          }
          return new Response(JSON.stringify({ items: [], total_count: 0 }), {
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response("{}", {
          headers: { "Content-Type": "application/json" },
        });
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
      linear_comments: expect.any(Number),
      repos: expect.any(Array),
      lines_added: expect.any(Number),
      lines_deleted: expect.any(Number),
      files_changed: expect.any(Number),
      median_review_latency_hours: null,
    });
    expect(result.terminalOutput).toBeDefined();
  });

  it("counts issues you moved to Done and projects you completed", async () => {
    process.env.LINEAR_API_KEY = "lin_test";
    process.env.GITHUB_TOKEN = "ghp_test";
    process.env.GITHUB_USERNAME = "testuser";

    const nowISO = new Date().toISOString();
    const completedByMe = {
      id: "issue-mine",
      identifier: "APO-1",
      title: "Closed by me, assigned to someone else",
      state: { name: "Done", type: "completed" },
      url: "https://linear.app/x/APO-1",
      completedAt: nowISO,
      assignee: { id: "user-2" },
      history: {
        nodes: [
          {
            createdAt: nowISO,
            actor: { id: "user-1" },
            toState: { type: "completed" },
          },
        ],
      },
    };
    const completedBySomeoneElse = {
      ...completedByMe,
      id: "issue-theirs",
      identifier: "APO-2",
      title: "Closed by a teammate",
      history: {
        nodes: [
          {
            createdAt: nowISO,
            actor: { id: "user-2" },
            toState: { type: "completed" },
          },
        ],
      },
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        if (url.includes("linear.app")) {
          const queryStr = String(
            (init?.body ? JSON.parse(init.body as string) : {}).query || ""
          );
          let data: unknown = {
            issues: { nodes: [], pageInfo: { hasNextPage: false } },
          };
          if (queryStr.includes("GetViewer")) {
            data = { viewer: { id: "user-1", name: "Test User" } };
          } else if (queryStr.includes("GetUserComments")) {
            data = {
              comments: { nodes: [], pageInfo: { hasNextPage: false } },
            };
          } else if (queryStr.includes("GetWindowCompletedIssues")) {
            data = {
              issues: {
                nodes: [completedByMe, completedBySomeoneElse],
                pageInfo: { hasNextPage: false },
              },
            };
          } else if (queryStr.includes("GetCompletedProjects")) {
            data = {
              projects: {
                nodes: [
                  {
                    id: "project-1",
                    name: "Crossroads Livestream Contentful Sync",
                    url: "https://linear.app/x/project-1",
                    completedAt: nowISO,
                    status: { name: "Complete", type: "completed" },
                    lead: { id: "user-1" },
                  },
                ],
                pageInfo: { hasNextPage: false },
              },
            };
          }
          return new Response(JSON.stringify({ data }), {
            headers: { "Content-Type": "application/json" },
          });
        }
        if (url.includes("/events")) {
          return new Response(JSON.stringify([]), {
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ items: [], total_count: 0 }), {
          headers: { "Content-Type": "application/json" },
        });
      })
    );

    const result = await runSummary({
      todayMode: true,
      checkInsText: "",
      outputDir: null,
    });

    // 1 issue you moved to Done (teammate's stays out) + 1 completed project
    expect(result.payload.stats.linear_completed).toBe(2);
    expect(result.payload.stats.linear_projects_completed).toBe(1);
    expect(
      result.payload.linear.completed_issues.map((i) => i.identifier)
    ).toEqual(["APO-1"]);
    expect(result.payload.linear.completed_projects).toHaveLength(1);
  });

  it("uses weekEnding window when provided", async () => {
    process.env.LINEAR_API_KEY = "lin_test";
    process.env.GITHUB_TOKEN = "ghp_test";
    process.env.GITHUB_USERNAME = "testuser";

    const result = await runSummary({
      todayMode: false,
      weekEnding: "2026-07-03",
      checkInsText: "",
      outputDir: null,
    });

    expect(result.payload.meta.week_ending).toBe("2026-07-03");
    const { windowStart, windowEnd } = getWindowForWeekEnding("2026-07-03");
    expect(result.payload.meta.window_start).toBe(windowStart.toISOString());
    expect(result.payload.meta.window_end).toBe(windowEnd.toISOString());
  });
});
