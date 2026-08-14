import { describe, it, expect } from "vitest";
import {
  formatDurationHours,
  formatSignedDurationHours,
} from "./utils";

describe("formatDurationHours", () => {
  it("shows minutes under one hour", () => {
    expect(formatDurationHours(0.1)).toBe("6m");
    expect(formatDurationHours(0.65)).toBe("39m");
  });

  it("rounds tiny non-zero values up to 1m", () => {
    expect(formatDurationHours(0.001)).toBe("1m");
  });

  it("keeps hours at one decimal under 10h", () => {
    expect(formatDurationHours(2.84)).toBe("2.8h");
  });

  it("rounds to whole hours at 10h+", () => {
    expect(formatDurationHours(10.73)).toBe("11h");
  });
});

describe("formatSignedDurationHours", () => {
  it("signs minute deltas", () => {
    expect(formatSignedDurationHours(0.1)).toBe("+6m");
    expect(formatSignedDurationHours(-0.5)).toBe("-30m");
  });

  it("signs hour deltas", () => {
    expect(formatSignedDurationHours(1.2)).toBe("+1.2h");
    expect(formatSignedDurationHours(-2)).toBe("-2h");
  });
});
