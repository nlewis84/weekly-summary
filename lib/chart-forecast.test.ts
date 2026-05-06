import { describe, it, expect } from "vitest";
import type { Payload } from "./types.js";
import {
  datesInWeekWindow,
  datesInMonthThrough,
  daysInCalendarMonth,
  getCurrentWeekEndingFriday,
  projectMetricsFromSnapshotDates,
  forecastMetricsFromSnapshotsForWeek,
  forecastMetricsFromSnapshotsForMonth,
} from "./chart-forecast";

const stat = (
  overrides: Partial<Payload["stats"]> = {}
): Payload["stats"] => ({
  prs_merged: 2,
  prs_total: 3,
  pr_reviews: 1,
  pr_comments: 0,
  commits_pushed: 0,
  linear_completed: 0,
  linear_worked_on: 0,
  linear_issues_created: 0,
  linear_comments: 0,
  repos: ["a", "b"],
  ...overrides,
});

const payloadFor = (stats: Payload["stats"]): Payload => ({
  meta: {
    generated_at: "",
    window_start: "",
    window_end: "",
    week_ending: "2026-05-01",
  },
  stats,
  linear: { completed_issues: [], worked_on_issues: [] },
  github: { merged_prs: [], open_prs: [], reviews: [] },
  check_ins: [],
  terminal_output: "",
  formatted_output: null,
});

describe("getCurrentWeekEndingFriday", () => {
  it("returns Friday for a known Wednesday in May 2026", () => {
    const wed = new Date(2026, 4, 6, 12, 0, 0);
    expect(getCurrentWeekEndingFriday(wed)).toBe("2026-05-08");
  });
});

describe("datesInWeekWindow", () => {
  it("returns 7 dates ending on weekEnding Friday", () => {
    const d = datesInWeekWindow("2026-05-08");
    expect(d).toHaveLength(7);
    expect(d[0]).toBe("2026-05-02");
    expect(d[6]).toBe("2026-05-08");
  });
});

describe("datesInMonthThrough", () => {
  it("returns days 1..through when within month", () => {
    const through = new Date(2026, 4, 5);
    const d = datesInMonthThrough("2026-05", through);
    expect(d[0]).toBe("2026-05-01");
    expect(d[d.length - 1]).toBe("2026-05-05");
  });
});

describe("daysInCalendarMonth", () => {
  it("returns 31 for May", () => {
    expect(daysInCalendarMonth("2026-05")).toBe(31);
  });
});

describe("projectMetricsFromSnapshotDates", () => {
  it("returns null when no snapshots", () => {
    expect(
      projectMetricsFromSnapshotDates(["2026-05-01"], 7, () => null)
    ).toBeNull();
  });

  it("scales one day to full week (×7)", () => {
    const load = (date: string) =>
      date === "2026-05-04" ? payloadFor(stat({ prs_merged: 2 })) : null;
    const out = projectMetricsFromSnapshotDates(
      ["2026-05-02", "2026-05-03", "2026-05-04", "2026-05-05"],
      7,
      load
    );
    expect(out).not.toBeNull();
    expect(out!.prs_merged).toBe(14);
  });

  it("averages two days then scales to week: (2+4)/2 * 7 = 21", () => {
    const load = (date: string) => {
      if (date === "2026-05-03") return payloadFor(stat({ prs_merged: 2 }));
      if (date === "2026-05-04") return payloadFor(stat({ prs_merged: 4 }));
      return null;
    };
    const out = projectMetricsFromSnapshotDates(
      datesInWeekWindow("2026-05-08"),
      7,
      load
    );
    expect(out!.prs_merged).toBe(21);
  });
});

describe("forecastMetricsFromSnapshotsForWeek", () => {
  it("delegates to week window dates", () => {
    const dates = datesInWeekWindow("2026-05-08");
    const load = (date: string) =>
      dates.includes(date) && date === "2026-05-08"
        ? payloadFor(stat({ prs_merged: 1 }))
        : null;
    const out = forecastMetricsFromSnapshotsForWeek("2026-05-08", load);
    expect(out).not.toBeNull();
    expect(out!.prs_merged).toBe(7);
  });
});

describe("forecastMetricsFromSnapshotsForMonth", () => {
  it("scales MTD to full month length", () => {
    const now = new Date(2026, 4, 5);
    const load = (date: string) =>
      date >= "2026-05-01" && date <= "2026-05-05"
        ? payloadFor(stat({ prs_merged: 2 }))
        : null;
    const out = forecastMetricsFromSnapshotsForMonth("2026-05", now, load);
    expect(out).not.toBeNull();
    expect(out!.prs_merged).toBe(Math.round(10 * (31 / 5)));
  });
});
