import { describe, it, expect, vi, beforeEach } from "vitest";
import { getChartsData } from "./charts-data";

vi.mock("./github-fetch.js", () => ({
  listWeeklySummaries: vi.fn(),
  fetchWeeklySummary: vi.fn(),
}));

const { listWeeklySummaries, fetchWeeklySummary } = await import("./github-fetch.js");

const mockPayload = (weekEnding: string, prsMerged: number, repo: string) => ({
  meta: {
    generated_at: "2026-02-05T12:00:00Z",
    window_start: "2026-01-26T00:00:00Z",
    window_end: "2026-02-01T23:59:59Z",
    week_ending: weekEnding,
  },
  stats: {
    prs_merged: prsMerged,
    prs_total: prsMerged + 1,
    pr_reviews: 2,
    pr_comments: 1,
    commits_pushed: 0,
    linear_completed: 3,
    linear_worked_on: 1,
    repos: [repo],
  },
  linear: { completed_issues: [], worked_on_issues: [] },
  github: {
    merged_prs: Array.from({ length: prsMerged }, (_, i) => ({
      title: `PR ${i}`,
      url: "https://github.com/example/pull/1",
      repo,
      merged_at: "2026-02-01T12:00:00Z",
    })),
    reviews: [],
  },
  check_ins: [],
  terminal_output: "",
  formatted_output: null,
});

describe("getChartsData", () => {
  beforeEach(() => {
    vi.mocked(listWeeklySummaries).mockReset();
    vi.mocked(fetchWeeklySummary).mockReset();
  });

  it("returns dataPoints and repoActivity from summaries", async () => {
    vi.mocked(listWeeklySummaries).mockResolvedValue(["2026-02-01", "2026-01-25"]);
    vi.mocked(fetchWeeklySummary)
      .mockResolvedValueOnce(mockPayload("2026-02-01", 3, "owner/repo-a"))
      .mockResolvedValueOnce(mockPayload("2026-01-25", 2, "owner/repo-a"));

    const result = await getChartsData();

    expect(result.dataPoints).toHaveLength(2);
    expect(result.dataPoints[0]).toMatchObject({
      week_ending: "2026-02-01",
      prs_merged: 3,
      pr_reviews: 2,
      linear_completed: 3,
      linear_worked_on: 1,
      repos_count: 1,
    });
    expect(result.repoActivity).toHaveLength(1);
    expect(result.repoActivity[0]).toMatchObject({
      repo: "owner/repo-a",
      total_prs: 5,
    });
  });

  it("sorts repoActivity by total_prs descending", async () => {
    vi.mocked(listWeeklySummaries).mockResolvedValue(["2026-02-01"]);
    vi.mocked(fetchWeeklySummary).mockResolvedValue({
      ...mockPayload("2026-02-01", 1, "owner/small"),
      github: {
        merged_prs: [
          { title: "x", url: "u", repo: "owner/small", merged_at: null },
          { title: "y", url: "u", repo: "owner/big", merged_at: null },
          { title: "z", url: "u", repo: "owner/big", merged_at: null },
        ],
        reviews: [],
      },
      stats: {
        prs_merged: 3,
        prs_total: 3,
        pr_reviews: 0,
        pr_comments: 0,
        commits_pushed: 0,
        linear_completed: 0,
        linear_worked_on: 0,
        repos: ["owner/small", "owner/big"],
      },
    });

    const result = await getChartsData();
    expect(result.repoActivity[0].repo).toBe("owner/big");
    expect(result.repoActivity[0].total_prs).toBe(2);
    expect(result.repoActivity[1].repo).toBe("owner/small");
    expect(result.repoActivity[1].total_prs).toBe(1);
  });

  it("skips weeks where fetch returns null", async () => {
    vi.mocked(listWeeklySummaries).mockResolvedValue(["2026-02-01", "2026-01-25"]);
    vi.mocked(fetchWeeklySummary)
      .mockResolvedValueOnce(mockPayload("2026-02-01", 1, "owner/repo"))
      .mockResolvedValueOnce(null);

    const result = await getChartsData();
    expect(result.dataPoints).toHaveLength(1);
    expect(result.dataPoints[0].week_ending).toBe("2026-02-01");
  });
});
