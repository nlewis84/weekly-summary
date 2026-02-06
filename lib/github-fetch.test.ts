import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listWeeklySummaries, fetchWeeklySummary } from "./github-fetch";

const mockPayload = {
  meta: {
    generated_at: "2026-02-05T12:00:00Z",
    window_start: "2026-01-26T00:00:00Z",
    window_end: "2026-02-01T23:59:59Z",
    week_ending: "2026-02-01",
  },
  stats: {
    prs_merged: 5,
    prs_total: 6,
    pr_reviews: 3,
    pr_comments: 2,
    linear_completed: 4,
    linear_worked_on: 2,
    repos: ["owner/repo1"],
  },
  linear: { completed_issues: [], worked_on_issues: [] },
  github: { merged_prs: [], reviews: [] },
  check_ins: [],
  terminal_output: "",
  formatted_output: null,
};

describe("listWeeklySummaries", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env = {
      ...originalEnv,
      GITHUB_TOKEN: "test-token",
      GITHUB_REPO: "owner/repo",
      GITHUB_SUMMARY_PATHS: "2026-weekly-work-summaries",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns sorted week endings from JSON files", async () => {
    const mockItems = [
      { name: "2026-02-01.json", path: "2026-weekly-work-summaries/2026-02-01.json", type: "file" },
      { name: "2026-01-25.json", path: "2026-weekly-work-summaries/2026-01-25.json", type: "file" },
      { name: "README.md", path: "2026-weekly-work-summaries/README.md", type: "file" },
    ];
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockItems),
    });

    const weeks = await listWeeklySummaries();
    expect(weeks).toEqual(["2026-02-01", "2026-01-25"]);
  });

  it("skips non-JSON files and invalid YYYY-MM-DD names", async () => {
    const mockItems = [
      { name: "2026-02-01.json", path: "x/2026-02-01.json", type: "file" },
      { name: "bad.json", path: "x/bad.json", type: "file" },
      { name: "not-a-date.json", path: "x/not-a-date.json", type: "file" },
    ];
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockItems),
    });

    const weeks = await listWeeklySummaries();
    expect(weeks).toEqual(["2026-02-01"]);
  });

  it("throws when GitHub API returns error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Bad credentials" }),
    });

    await expect(listWeeklySummaries()).rejects.toThrow("Bad credentials");
  });
});

describe("fetchWeeklySummary", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env = {
      ...originalEnv,
      GITHUB_TOKEN: "test-token",
      GITHUB_REPO: "owner/repo",
      GITHUB_SUMMARY_PATHS: "2026-weekly-work-summaries",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns payload when found", async () => {
    const content = Buffer.from(JSON.stringify(mockPayload), "utf8").toString("base64");
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content, encoding: "base64" }),
    });

    const result = await fetchWeeklySummary("2026-02-01");
    expect(result).toEqual(mockPayload);
  });

  it("returns null when 404", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const result = await fetchWeeklySummary("2026-99-99");
    expect(result).toBeNull();
  });

  it("throws when content is invalid", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content: null, encoding: "base64" }),
    });

    await expect(fetchWeeklySummary("2026-02-01")).rejects.toThrow("Invalid GitHub content");
  });
});
