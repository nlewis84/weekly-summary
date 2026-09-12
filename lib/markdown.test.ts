import { describe, it, expect } from "vitest";
import { buildBasecampSummary } from "./markdown";
import type { Payload } from "./types";

function makePayload(overrides: Partial<Payload> = {}): Payload {
  const base: Payload = {
    meta: {
      generated_at: "2026-04-17T21:16:18.703Z",
      window_start: "2026-04-11T00:00:00.000Z",
      window_end: "2026-04-18T00:00:00.000Z",
      week_ending: "2026-04-17",
    },
    stats: {
      prs_merged: 0,
      prs_total: 0,
      pr_reviews: 0,
      pr_comments: 0,
      commits_pushed: 0,
      linear_completed: 0,
      linear_worked_on: 0,
      linear_issues_created: 0,
      linear_comments: 0,
      repos: [],
    },
    linear: {
      completed_issues: [],
      worked_on_issues: [],
      created_issues: [],
      commented_issues: [],
    },
    github: {
      merged_prs: [],
      open_prs: [],
      reviews: [],
    },
    check_ins: [],
    terminal_output: "",
    formatted_output: null,
  };
  return {
    ...base,
    ...overrides,
    linear: { ...base.linear, ...(overrides.linear ?? {}) },
    github: { ...base.github, ...(overrides.github ?? {}) },
  };
}

describe("buildBasecampSummary", () => {
  it("starts with a blank `Callouts for:` placeholder", () => {
    const md = buildBasecampSummary(makePayload());
    expect(md.startsWith("Callouts for:\n\n")).toBe(true);
  });

  it("omits every section when there is no content", () => {
    const md = buildBasecampSummary(makePayload());
    expect(md).not.toContain("PRs merged");
    expect(md).not.toContain("PRs active");
    expect(md).not.toContain("PR reviews");
    expect(md).not.toContain("Linear done");
    expect(md).not.toContain("Linear active");
    expect(md).not.toContain("Linear created");
  });

  it("does not emit any of the removed sections", () => {
    const md = buildBasecampSummary(
      makePayload({
        github: {
          merged_prs: [
            { title: "fix: something", url: "https://x", repo: "apollos-admin", merged_at: null },
          ],
          open_prs: [],
          reviews: [],
        },
        linear: {
          completed_issues: [],
          worked_on_issues: [],
          created_issues: [],
          commented_issues: [{ identifier: "APO-1", title: "Reply thing" }],
        },
      })
    );
    expect(md).not.toContain("Weekly Work Summary");
    expect(md).not.toContain("Generated");
    expect(md).not.toContain("Source of truth");
    expect(md).not.toContain("Stats");
    expect(md).not.toContain("Linear — Replies");
    expect(md).not.toContain("Check-ins");
    expect(md).not.toContain("Terminal output");
  });

  it("reports every section as a count, never as a list of items", () => {
    const reviews = Array.from({ length: 194 }, (_, i) => ({
      title: `review ${i}`,
      url: `https://github.com/ApollosProject/apollos-admin/pull/${i}`,
      repo: "apollos-admin",
      latency_hours: 1.5,
    }));
    const md = buildBasecampSummary(
      makePayload({
        github: {
          merged_prs: [
            { title: "fix: a thing", url: "https://github.com/x/1", repo: "apollos-admin", merged_at: null },
            { title: "fix: another", url: "https://github.com/x/2", repo: "apollos-cluster", merged_at: null },
          ],
          open_prs: [
            { title: "wip", url: "https://github.com/x/3", repo: "apollos-admin", state: "open" },
          ],
          reviews,
        },
        linear: {
          completed_issues: [{ identifier: "APO-1", title: "done" }, { identifier: "APO-2", title: "done2" }],
          worked_on_issues: [{ identifier: "APO-3", title: "wip" }],
          created_issues: [{ identifier: "APO-4", title: "new" }, { identifier: "APO-5", title: "new2" }],
          commented_issues: [],
        },
      })
    );

    expect(md).toContain("PRs merged\n- Merged 2 PRs");
    expect(md).toContain("PRs active\n- 1 PR still open");
    expect(md).toContain("PR reviews\n- Reviewed 194 PRs");
    expect(md).toContain("Linear done\n- Completed 2 issues");
    expect(md).toContain("Linear active\n- Worked on 1 issue");
    expect(md).toContain("Linear created\n- Created 2 issues");

    // No per-item detail leaks through: that is what blew Basecamp's size limit.
    expect(md).not.toContain("review 0");
    expect(md).not.toContain("github.com");
    expect(md).not.toContain("APO-1");
    expect(md).not.toContain("1.5h");
    expect(md.length).toBeLessThan(400);
  });

  it("emits sections in the expected order", () => {
    const md = buildBasecampSummary(
      makePayload({
        github: {
          merged_prs: [{ title: "a", url: "https://x/1", repo: "r", merged_at: null }],
          open_prs: [{ title: "b", url: "https://x/2", repo: "r", state: "open" }],
          reviews: [{ title: "c", url: "https://x/3" }],
        },
        linear: {
          completed_issues: [{ identifier: "APO-1", title: "done", url: "https://l/1" }],
          worked_on_issues: [{ identifier: "APO-2", title: "active", url: "https://l/2" }],
          created_issues: [{ identifier: "APO-3", title: "created", url: "https://l/3" }],
          commented_issues: [],
        },
      })
    );

    const order = [
      "Callouts for:",
      "PRs merged",
      "PRs active",
      "PR reviews",
      "Linear done",
      "Linear active",
      "Linear created",
    ];
    let lastIdx = -1;
    for (const section of order) {
      const idx = md.indexOf(section);
      expect(idx, `expected to find ${section}`).toBeGreaterThan(-1);
      expect(idx, `expected ${section} after index ${lastIdx}`).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }
  });
});
