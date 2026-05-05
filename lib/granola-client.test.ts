import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchGranolaNotesForWindow,
  isGranolaConfigured,
} from "./granola-client";

function jsonResponse(obj: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(obj),
  });
}

describe("granola-client", () => {
  const originalKey = process.env.GRANOLA_API_KEY;

  afterEach(() => {
    process.env.GRANOLA_API_KEY = originalKey;
    vi.unstubAllGlobals();
  });

  it("isGranolaConfigured is false when unset", () => {
    delete process.env.GRANOLA_API_KEY;
    expect(isGranolaConfigured()).toBe(false);
  });

  it("isGranolaConfigured is true when set", () => {
    process.env.GRANOLA_API_KEY = "grn_x";
    expect(isGranolaConfigured()).toBe(true);
  });

  it("returns empty notes without calling fetch when not configured", async () => {
    delete process.env.GRANOLA_API_KEY;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const r = await fetchGranolaNotesForWindow(
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T23:59:59.999Z"
    );
    expect(r.notes).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("lists one page and maps note details", async () => {
    process.env.GRANOLA_API_KEY = "grn_test";
    const noteId = "not_abcdefghijklm";
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/v1/notes?")) {
        return jsonResponse({
          notes: [
            {
              id: noteId,
              title: "Planning",
              created_at: "2026-01-01T10:00:00Z",
              updated_at: "2026-01-01T11:00:00Z",
            },
          ],
          hasMore: false,
          cursor: null,
        });
      }
      if (url.includes(`/v1/notes/${noteId}`)) {
        return jsonResponse({
          id: noteId,
          title: "Planning",
          summary_text: "Shipped the roadmap.",
        });
      }
      return Promise.reject(new Error(`unexpected fetch: ${url}`));
    });
    vi.stubGlobal("fetch", fetchMock);

    const r = await fetchGranolaNotesForWindow(
      "2026-01-01T00:00:00.000Z",
      "2026-01-02T00:00:00.000Z"
    );

    expect(r.notes).toHaveLength(1);
    expect(r.notes[0]).toEqual({
      id: noteId,
      title: "Planning",
      summaryText: "Shipped the roadmap.",
    });
    expect(r.warning).toBeUndefined();
    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns warning on API error without throwing", async () => {
    process.env.GRANOLA_API_KEY = "grn_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve("unauthorized"),
        })
      )
    );

    const r = await fetchGranolaNotesForWindow(
      "2026-01-01T00:00:00.000Z",
      "2026-01-02T00:00:00.000Z"
    );
    expect(r.notes).toEqual([]);
    expect(r.warning).toMatch(/401/);
  });
});
