import { describe, it, expect } from "vitest";
import {
  computeLatencyHours,
  findRequestedAt,
  median,
  parsePrRef,
  sumVolume,
} from "./github-metrics";

describe("computeLatencyHours", () => {
  it("returns hours between requested and reviewed", () => {
    expect(
      computeLatencyHours(
        "2026-07-01T10:00:00Z",
        "2026-07-01T14:00:00Z"
      )
    ).toBe(4);
  });

  it("returns null when requested is missing (drive-by)", () => {
    expect(computeLatencyHours(null, "2026-07-01T14:00:00Z")).toBeNull();
  });

  it("returns null when reviewed is before requested", () => {
    expect(
      computeLatencyHours(
        "2026-07-01T14:00:00Z",
        "2026-07-01T10:00:00Z"
      )
    ).toBeNull();
  });
});

describe("median", () => {
  it("returns null for empty", () => {
    expect(median([])).toBeNull();
  });

  it("returns middle for odd length", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("averages middle pair for even length", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe("findRequestedAt", () => {
  const username = "nlewis84";

  it("returns earliest request before review", () => {
    const events = [
      {
        event: "review_requested",
        created_at: "2026-07-01T12:00:00Z",
        requested_reviewer: { login: username },
      },
      {
        event: "review_requested",
        created_at: "2026-07-01T08:00:00Z",
        requested_reviewer: { login: username },
      },
      {
        event: "review_requested",
        created_at: "2026-07-01T09:00:00Z",
        requested_reviewer: { login: "someone-else" },
      },
    ];
    expect(
      findRequestedAt(events, username, "2026-07-01T14:00:00Z")
    ).toBe("2026-07-01T08:00:00Z");
  });

  it("ignores requests after the review (re-request edge)", () => {
    const events = [
      {
        event: "review_requested",
        created_at: "2026-07-01T08:00:00Z",
        requested_reviewer: { login: username },
      },
      {
        event: "review_requested",
        created_at: "2026-07-02T10:00:00Z",
        requested_reviewer: { login: username },
      },
    ];
    expect(
      findRequestedAt(events, username, "2026-07-01T14:00:00Z")
    ).toBe("2026-07-01T08:00:00Z");
  });

  it("returns null for drive-by (never requested)", () => {
    const events = [
      {
        event: "commented",
        created_at: "2026-07-01T08:00:00Z",
      },
    ];
    expect(
      findRequestedAt(events, username, "2026-07-01T14:00:00Z")
    ).toBeNull();
  });
});

describe("sumVolume", () => {
  it("sums additions, deletions, and files", () => {
    expect(
      sumVolume([
        { additions: 10, deletions: 2, changed_files: 3 },
        { additions: 5, deletions: 1, changed_files: 1 },
      ])
    ).toEqual({ lines_added: 15, lines_deleted: 3, files_changed: 4 });
  });

  it("treats missing fields as 0", () => {
    expect(sumVolume([{}, { additions: 2 }])).toEqual({
      lines_added: 2,
      lines_deleted: 0,
      files_changed: 0,
    });
  });
});

describe("parsePrRef", () => {
  it("parses github PR urls", () => {
    expect(
      parsePrRef("https://github.com/ApollosProject/apollos-admin/pull/3696")
    ).toEqual({
      owner: "ApollosProject",
      repo: "apollos-admin",
      number: 3696,
    });
  });

  it("returns null for invalid urls", () => {
    expect(parsePrRef("not-a-url")).toBeNull();
  });
});
