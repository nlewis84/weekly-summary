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

  it("formats PR items as `[title](url)(repo)` markdown list bullets", () => {
    const md = buildBasecampSummary(
      makePayload({
        github: {
          merged_prs: [
            {
              title: "fix: pagination controls to Transactions should be outside the parent div",
              url: "https://github.com/ApollosProject/apollos-admin/pull/1",
              repo: "apollos-admin",
              merged_at: "2026-04-17T12:00:00.000Z",
            },
            {
              title: "feat: add stripe_platform_id column to customers table",
              url: "https://github.com/ApollosProject/apollos-cluster/pull/2",
              repo: "apollos-cluster",
              merged_at: "2026-04-16T12:00:00.000Z",
            },
          ],
          open_prs: [
            {
              title: "feat: enrich transactions with Stripe balance transaction fees and net",
              url: "https://github.com/ApollosProject/apollos-admin/pull/3",
              repo: "apollos-admin",
              state: "open",
            },
          ],
          reviews: [
            { title: "feat: default status filter on recurring tab", url: "https://github.com/x" },
          ],
        },
      })
    );

    expect(md).toContain(
      "PRs merged\n- [fix: pagination controls to Transactions should be outside the parent div](https://github.com/ApollosProject/apollos-admin/pull/1)(apollos-admin)\n- [feat: add stripe_platform_id column to customers table](https://github.com/ApollosProject/apollos-cluster/pull/2)(apollos-cluster)"
    );
    expect(md).toContain(
      "PRs active\n- [feat: enrich transactions with Stripe balance transaction fees and net](https://github.com/ApollosProject/apollos-admin/pull/3)(apollos-admin)"
    );
    expect(md).toContain(
      "PR reviews\n- [feat: default status filter on recurring tab](https://github.com/x)"
    );
    expect(md).not.toContain("2026-04-17");
  });

  it("falls back to title-only when PR repo and url are missing", () => {
    const md = buildBasecampSummary(
      makePayload({
        github: {
          merged_prs: [{ title: "chore: orphan pr", url: "", repo: null, merged_at: null }],
          open_prs: [],
          reviews: [],
        },
      })
    );
    expect(md).toContain("PRs merged\n- chore: orphan pr\n");
    expect(md).not.toContain("chore: orphan pr(");
    expect(md).not.toContain("[chore: orphan pr]");
  });

  it("formats Linear items as `[IDENTIFIER title](url)` markdown list bullets", () => {
    const md = buildBasecampSummary(
      makePayload({
        linear: {
          completed_issues: [
            {
              identifier: "APO-8303",
              title: "Handle staging Pushpay URL when forwarding query params",
              completedAt: "2026-04-14T12:00:00.000Z",
              project: "Project A",
              url: "https://linear.app/x/issue/APO-8303/handle-staging-pushpay",
            },
          ],
          worked_on_issues: [
            {
              identifier: "APO-8668",
              title: "Enrich transactions with balance transaction fee data in loader",
              url: "https://linear.app/x/issue/APO-8668/enrich-transactions",
            },
          ],
          created_issues: [
            {
              identifier: "APO-8669",
              title: "Zero fees in payouts export for gross-settled churches",
              createdAt: "2026-04-17T12:00:00.000Z",
              url: "https://linear.app/x/issue/APO-8669/zero-fees",
            },
          ],
          commented_issues: [],
        },
      })
    );

    expect(md).toContain(
      "Linear done\n- [APO-8303 Handle staging Pushpay URL when forwarding query params](https://linear.app/x/issue/APO-8303/handle-staging-pushpay)"
    );
    expect(md).toContain(
      "Linear active\n- [APO-8668 Enrich transactions with balance transaction fee data in loader](https://linear.app/x/issue/APO-8668/enrich-transactions)"
    );
    expect(md).toContain(
      "Linear created\n- [APO-8669 Zero fees in payouts export for gross-settled churches](https://linear.app/x/issue/APO-8669/zero-fees)"
    );
    expect(md).not.toContain("2026-04-14");
    expect(md).not.toContain("2026-04-17");
    expect(md).not.toContain("Project A");
  });

  it("falls back to plain `IDENTIFIER title` when Linear url is missing", () => {
    const md = buildBasecampSummary(
      makePayload({
        linear: {
          completed_issues: [{ identifier: "APO-1", title: "no url" }],
          worked_on_issues: [],
          created_issues: [],
          commented_issues: [],
        },
      })
    );
    expect(md).toContain("Linear done\n- APO-1 no url\n");
    expect(md).not.toContain("[APO-1 no url]");
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
