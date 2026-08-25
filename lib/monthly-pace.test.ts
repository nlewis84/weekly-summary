import { describe, it, expect } from "vitest";
import {
  buildMonthDays,
  businessDaysInMonth,
  businessDaysThrough,
  computePace,
  currentMonth,
  daysInMonth,
  monthLabel,
  type MonthlyMergedPr,
  type MonthlyProgress,
} from "./monthly-pace";

const pr = (day: string, n: number): MonthlyMergedPr[] =>
  Array.from({ length: n }, (_, i) => ({
    title: `pr ${day}-${i}`,
    url: `https://github.com/Org/repo/pull/${day.replace(/-/g, "")}${i}`,
    repo: "repo",
    merged_at: `${day}T12:00:00Z`,
    day,
  }));

const progress = (
  overrides: Partial<MonthlyProgress> = {}
): MonthlyProgress => ({
  month: "2026-08",
  label: "August 2026",
  merged: 0,
  days: [],
  daysInMonth: 31,
  businessDaysInMonth: 21,
  businessDaysElapsed: 0,
  through: "2026-08-01",
  isCurrentMonth: true,
  topRepos: [],
  generated_at: "2026-08-25T12:00:00.000Z",
  ...overrides,
});

describe("calendar helpers", () => {
  it("names the month", () => {
    expect(monthLabel("2026-08")).toBe("August 2026");
    expect(monthLabel("2026-01")).toBe("January 2026");
  });

  it("counts calendar days including leap February", () => {
    expect(daysInMonth("2026-08")).toBe(31);
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
  });

  it("counts Mon–Fri in the month", () => {
    // Aug 2026 starts on a Saturday: 21 weekdays.
    expect(businessDaysInMonth("2026-08")).toBe(21);
  });

  it("counts elapsed business days inclusive of the through-day", () => {
    // Through Tue Aug 25: 5 + 5 + 5 + 2.
    expect(businessDaysThrough("2026-08", 25)).toBe(17);
    expect(businessDaysThrough("2026-08", 1)).toBe(0);
    expect(businessDaysThrough("2026-08", 0)).toBe(0);
    // Past the end clamps to the whole month.
    expect(businessDaysThrough("2026-08", 99)).toBe(21);
  });

  it("derives the current month from a local date", () => {
    expect(currentMonth(new Date(2026, 7, 25))).toBe("2026-08");
    expect(currentMonth(new Date(2026, 0, 3))).toBe("2026-01");
  });
});

describe("buildMonthDays", () => {
  it("buckets merges and carries a running total", () => {
    const days = buildMonthDays(
      "2026-08",
      [...pr("2026-08-03", 2), ...pr("2026-08-05", 1)],
      "2026-08-05"
    );
    expect(days).toHaveLength(31);
    expect(days[2]).toMatchObject({ date: "2026-08-03", merged: 2, cumulative: 2 });
    expect(days[3]).toMatchObject({ date: "2026-08-04", merged: 0, cumulative: 2 });
    expect(days[4]).toMatchObject({ date: "2026-08-05", merged: 1, cumulative: 3 });
  });

  it("leaves days past the through-date empty rather than flat-lining them", () => {
    const days = buildMonthDays("2026-08", pr("2026-08-03", 2), "2026-08-05");
    expect(days[5]).toMatchObject({ date: "2026-08-06", isFuture: true, cumulative: null });
    expect(days.at(-1)).toMatchObject({ isFuture: true, cumulative: null });
  });

  it("flags weekends as non-business days", () => {
    const days = buildMonthDays("2026-08", [], "2026-08-31");
    expect(days[0]).toMatchObject({ date: "2026-08-01", isBusinessDay: false });
    expect(days[2]).toMatchObject({ date: "2026-08-03", isBusinessDay: true });
  });
});

describe("computePace", () => {
  const base = progress({ businessDaysElapsed: 17 }); // through Tue Aug 25

  it("prorates the target over elapsed business days", () => {
    const pace = computePace({ ...base, merged: 20 }, 28);
    expect(pace.expected).toBeCloseTo(22.7, 1);
    expect(pace.businessDaysLeft).toBe(4);
  });

  it("projects month-end from the rate so far", () => {
    const pace = computePace({ ...base, merged: 17 }, 28);
    expect(pace.projected).toBe(21);
  });

  it("reports met once the target is reached", () => {
    const pace = computePace({ ...base, merged: 51 }, 28);
    expect(pace.status).toBe("met");
    expect(pace.remaining).toBe(0);
    expect(pace.perDayNeeded).toBeNull();
    expect(pace.pct).toBe(182);
  });

  it("treats a PR either side of the ideal line as on pace", () => {
    expect(computePace({ ...base, merged: 22 }, 28).status).toBe("on-pace");
    expect(computePace({ ...base, merged: 23 }, 28).status).toBe("on-pace");
    expect(computePace({ ...base, merged: 24 }, 28).status).toBe("ahead");
    expect(computePace({ ...base, merged: 21 }, 28).status).toBe("behind");
  });

  it("spreads the shortfall across the business days left", () => {
    const pace = computePace({ ...base, merged: 18 }, 28);
    expect(pace.remaining).toBe(10);
    expect(pace.perDayNeeded).toBe(2.5);
  });

  it("stops dividing when the month is out of business days", () => {
    const pace = computePace(
      progress({ merged: 20, businessDaysElapsed: 21 }),
      28
    );
    expect(pace.businessDaysLeft).toBe(0);
    expect(pace.perDayNeeded).toBeNull();
    expect(pace.status).toBe("behind");
  });

  it("holds at the start of the month without dividing by zero", () => {
    const pace = computePace(progress({ merged: 0, businessDaysElapsed: 0 }), 28);
    expect(pace.expected).toBe(0);
    expect(pace.projected).toBe(0);
    expect(pace.status).toBe("on-pace");
  });
});
