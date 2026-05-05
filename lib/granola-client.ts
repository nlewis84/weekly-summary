/**
 * Granola public API (https://public-api.granola.ai).
 * List filters use note created_at, not calendar scheduled time — see Granola docs.
 */

const GRANOLA_API_BASE = "https://public-api.granola.ai/v1";
const LIST_PAGE_SIZE = 30;
const MAX_LIST_PAGES = 25;
const MAX_NOTES_TO_FETCH = 50;
const DETAIL_CONCURRENCY = 5;

export function isGranolaConfigured(): boolean {
  return !!process.env.GRANOLA_API_KEY?.trim();
}

function getApiKey(): string {
  const key = process.env.GRANOLA_API_KEY?.trim();
  if (!key) throw new Error("GRANOLA_API_KEY is not set");
  return key;
}

export interface GranolaNoteForCheckIn {
  id: string;
  title: string | null;
  summaryText: string;
}

export interface FetchGranolaNotesResult {
  notes: GranolaNoteForCheckIn[];
  warning?: string;
}

interface ListNotesResponse {
  notes: Array<{
    id: string;
    title: string | null;
    created_at: string;
    updated_at: string;
  }>;
  hasMore: boolean;
  cursor: string | null;
}

interface GetNoteResponse {
  id: string;
  title: string | null;
  summary_text: string;
}

async function granolaFetch<T>(path: string): Promise<T> {
  const key = getApiKey();
  const res = await fetch(`${GRANOLA_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Granola API ${res.status}: ${body.slice(0, 200) || res.statusText}`
    );
  }
  return res.json() as Promise<T>;
}

/**
 * Lists note ids in [windowStart, windowEnd] by created_at, then fetches each note for summary_text.
 */
export async function fetchGranolaNotesForWindow(
  windowStartISO: string,
  windowEndISO: string
): Promise<FetchGranolaNotesResult> {
  if (!isGranolaConfigured()) {
    return { notes: [] };
  }

  try {
    const params = new URLSearchParams();
    params.set("created_after", windowStartISO);
    params.set("created_before", windowEndISO);
    params.set("page_size", String(LIST_PAGE_SIZE));

    const ids: string[] = [];
    let cursor: string | null = null;
    let pages = 0;

    do {
      const q = new URLSearchParams(params);
      if (cursor) q.set("cursor", cursor);

      const list = await granolaFetch<ListNotesResponse>(`/notes?${q}`);
      for (const n of list.notes) {
        if (!ids.includes(n.id)) ids.push(n.id);
      }
      cursor = list.hasMore && list.cursor ? list.cursor : null;
      pages += 1;
      if (pages >= MAX_LIST_PAGES || ids.length >= MAX_NOTES_TO_FETCH) break;
    } while (cursor);

    const slice = ids.slice(0, MAX_NOTES_TO_FETCH);
    const notes: GranolaNoteForCheckIn[] = [];

    for (let i = 0; i < slice.length; i += DETAIL_CONCURRENCY) {
      const batch = slice.slice(i, i + DETAIL_CONCURRENCY);
      const details = await Promise.all(
        batch.map((id) =>
          granolaFetch<GetNoteResponse>(`/notes/${encodeURIComponent(id)}`)
        )
      );
      for (const d of details) {
        notes.push({
          id: d.id,
          title: d.title,
          summaryText: d.summary_text ?? "",
        });
      }
    }

    return { notes };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Granola request failed";
    console.error("Granola fetch error:", msg);
    return { notes: [], warning: msg };
  }
}
