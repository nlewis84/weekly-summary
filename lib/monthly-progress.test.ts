import { describe, it, expect, beforeEach } from "vitest";
import {
  buildProgress,
  getMonthlyProgress,
  resetMonthlyProgressCache,
} from "./monthly-progress";
import { dataCache } from "./cache";
import type { MonthlyMergedPr } from "./monthly-pace";

const NOW = new Date(2026, 7, 25, 12, 0, 0); // Tue Aug 25 2026, local

function prs(n: number): MonthlyMergedPr[] {
  return Array.from({ length: n }, (_, i) => ({
    title: `pr ${i}`,
    url: `https://github.com/Org/repo/pull/${i}`,
    repo: "repo",
    merged_at: `2026-08-1${i % 10}T12:00:00Z`,
    day: `2026-08-1${i % 10}`,
  }));
}

/** A search that counts calls, so the cache policy is observable. */
function countingSearch(result: MonthlyMergedPr[] | (() => never)) {
  let calls = 0;
  return {
    calls: () => calls,
    fn: async () => {
      calls += 1;
      if (typeof result === "function") return result();
      return result;
    },
  };
}

beforeEach(() => {
  resetMonthlyProgressCache();
  dataCache.bustAll();
});

describe("buildProgress", () => {
  it("summarises the month from its merged PRs", () => {
    const p = buildProgress("2026-08", prs(3), NOW);
    expect(p.merged).toBe(3);
    expect(p.month).toBe("2026-08");
    expect(p.through).toBe("2026-08-25");
    expect(p.isCurrentMonth).toBe(true);
    expect(p.stale).toBe(false);
    expect(p.topRepos).toEqual([{ repo: "repo", count: 3 }]);
  });

  it("treats a future month as entirely unelapsed", () => {
    const p = buildProgress("2026-12", [], NOW);
    expect(p.businessDaysElapsed).toBe(0);
    expect(p.days.every((d) => d.isFuture)).toBe(true);
  });
});

describe("getMonthlyProgress caching", () => {
  it("searches once, then serves cache", async () => {
    const s = countingSearch(prs(5));
    await getMonthlyProgress("2026-08", { now: NOW, search: s.fn });
    await getMonthlyProgress("2026-08", { now: NOW, search: s.fn });
    await getMonthlyProgress("2026-08", { now: NOW, search: s.fn });
    expect(s.calls()).toBe(1);
  });

  it("holds the refresh floor even when the caller busts", async () => {
    const s = countingSearch(prs(5));
    await getMonthlyProgress("2026-08", { now: NOW, search: s.fn });
    for (const minutes of [1, 5, 9]) {
      await getMonthlyProgress("2026-08", {
        bust: true,
        now: new Date(NOW.getTime() + minutes * 60_000),
        search: s.fn,
      });
    }
    expect(s.calls()).toBe(1);
  });

  it("caps searches across a run of auto-refreshes", async () => {
    const s = countingSearch(prs(5));
    // The home page busts every 5 minutes; over half an hour that is seven
    // loads, which used to mean seven searches.
    for (let minutes = 0; minutes <= 30; minutes += 5) {
      await getMonthlyProgress("2026-08", {
        bust: minutes > 0,
        now: new Date(NOW.getTime() + minutes * 60_000),
        search: s.fn,
      });
    }
    expect(s.calls()).toBe(4);
  });

  it("searches again once the floor has passed", async () => {
    const s = countingSearch(prs(5));
    await getMonthlyProgress("2026-08", { now: NOW, search: s.fn });
    await getMonthlyProgress("2026-08", {
      bust: true,
      now: new Date(NOW.getTime() + 11 * 60_000),
      search: s.fn,
    });
    expect(s.calls()).toBe(2);
  });

  it("collapses concurrent requests into one search", async () => {
    let release: (v: MonthlyMergedPr[]) => void;
    const gate = new Promise<MonthlyMergedPr[]>((r) => (release = r));
    let calls = 0;
    const search = async () => {
      calls += 1;
      return gate;
    };
    const both = Promise.all([
      getMonthlyProgress("2026-08", { now: NOW, search }),
      getMonthlyProgress("2026-08", { now: NOW, search }),
    ]);
    release!(prs(4));
    const [a, b] = await both;
    expect(calls).toBe(1);
    expect(a.merged).toBe(4);
    expect(b.merged).toBe(4);
  });

  it("serves the last good result when the search fails", async () => {
    const good = countingSearch(prs(7));
    await getMonthlyProgress("2026-08", { now: NOW, search: good.fn });

    const later = new Date(NOW.getTime() + 11 * 60_000);
    const result = await getMonthlyProgress("2026-08", {
      bust: true,
      now: later,
      search: async () => {
        throw new Error("API rate limit exceeded");
      },
    });
    expect(result.merged).toBe(7);
    expect(result.stale).toBe(true);
  });

  it("does not push the next attempt out after a failure", async () => {
    await getMonthlyProgress("2026-08", { now: NOW, search: async () => prs(7) });
    const later = new Date(NOW.getTime() + 11 * 60_000);
    await getMonthlyProgress("2026-08", {
      bust: true,
      now: later,
      search: async () => {
        throw new Error("boom");
      },
    });
    // The floor still runs from the last *good* fetch, so this one goes out.
    const s = countingSearch(prs(9));
    const fresh = await getMonthlyProgress("2026-08", {
      bust: true,
      now: new Date(NOW.getTime() + 12 * 60_000),
      search: s.fn,
    });
    expect(s.calls()).toBe(1);
    expect(fresh.merged).toBe(9);
    expect(fresh.stale).toBe(false);
  });

  it("propagates the error when there is nothing cached to fall back on", async () => {
    await expect(
      getMonthlyProgress("2026-08", {
        now: NOW,
        search: async () => {
          throw new Error("API rate limit exceeded");
        },
      })
    ).rejects.toThrow("API rate limit exceeded");
  });
});
