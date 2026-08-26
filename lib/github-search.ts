/**
 * One gate for every GitHub *search* request.
 *
 * Search has its own budget — 30 requests per minute — separate from and far
 * smaller than the 5,000/hour core limit that the quota indicator reports. One
 * uncached home page load spends seven of them (three for today, three for the
 * week, one for the month), so two loads landing together can exhaust a third
 * of the minute's budget on their own.
 *
 * That budget has to be managed before it is spent rather than discovered from
 * a 403, so every search goes through here: the remaining count is tracked from
 * the response headers GitHub already sends, seeded from `/rate_limit` (which
 * is free — it does not count against any limit), and requests are refused
 * locally once the budget nears empty.
 */

const GITHUB_API_BASE = "https://api.github.com";

/**
 * How much of the budget each caller must leave behind.
 *
 * Today and this week are what the page is for. The month-to-date count can be
 * minutes stale without anyone noticing, so it yields first and by a wide
 * margin — the reserve is what keeps a background refresh of the monthly number
 * from being the reason an interactive load fails.
 */
export type SearchPriority = "high" | "low";
const RESERVE: Record<SearchPriority, number> = { high: 2, low: 10 };

/** Treat an unknown reset as a minute out; search windows are per-minute. */
const DEFAULT_WINDOW_MS = 60_000;

export interface SearchBudget {
  limit: number;
  remaining: number;
  /** Epoch ms when the window rolls over. */
  resetAt: number;
}

export class SearchBudgetError extends Error {
  readonly remaining: number;
  readonly resetAt: number;
  constructor(remaining: number, resetAt: number) {
    const seconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
    super(
      `GitHub search budget too low (${remaining} left); resets in ${seconds}s`
    );
    this.name = "SearchBudgetError";
    this.remaining = remaining;
    this.resetAt = resetAt;
  }
}

let budget: SearchBudget | null = null;
let refreshing: Promise<SearchBudget | null> | null = null;

export function peekSearchBudget(): SearchBudget | null {
  return budget;
}

/** Test helper — module state outlives individual cases. */
export function resetSearchBudget(): void {
  budget = null;
  refreshing = null;
}

/** Headers on every search response are the authoritative view; prefer them. */
export function recordSearchResponse(res: {
  headers: { get(name: string): string | null };
}): void {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const limit = res.headers.get("x-ratelimit-limit");
  const reset = res.headers.get("x-ratelimit-reset");
  if (remaining == null) return;
  const parsedRemaining = Number.parseInt(remaining, 10);
  if (!Number.isFinite(parsedRemaining)) return;
  const parsedReset = reset != null ? Number.parseInt(reset, 10) : NaN;
  budget = {
    limit: Number.isFinite(Number.parseInt(limit ?? "", 10))
      ? Number.parseInt(limit!, 10)
      : (budget?.limit ?? 30),
    remaining: parsedRemaining,
    resetAt: Number.isFinite(parsedReset)
      ? parsedReset * 1000
      : Date.now() + DEFAULT_WINDOW_MS,
  };
}

/**
 * Seed the budget from `/rate_limit`. That endpoint is documented as not
 * counting against any rate limit, so asking is free — which is the whole
 * reason we can know the budget instead of guessing at it.
 */
export async function refreshSearchBudget(
  headers: HeadersInit,
  fetchImpl: typeof fetch = fetch
): Promise<SearchBudget | null> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetchImpl(`${GITHUB_API_BASE}/rate_limit`, { headers });
      if (!res.ok) return null;
      const body = (await res.json()) as {
        resources?: {
          search?: { limit: number; remaining: number; reset: number };
        };
      };
      const search = body.resources?.search;
      if (!search) return null;
      budget = {
        limit: search.limit,
        remaining: search.remaining,
        resetAt: search.reset * 1000,
      };
      return budget;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/**
 * Perform a search request, or refuse it locally if spending it would eat into
 * the reserve. Throws SearchBudgetError without contacting GitHub when the
 * budget is short — callers are expected to fall back to cached data.
 */
export async function searchRequest(
  url: string,
  headers: HeadersInit,
  options: { priority: SearchPriority; fetchImpl?: typeof fetch } = {
    priority: "high",
  }
): Promise<Response> {
  const { priority } = options;
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = Date.now();

  // A lapsed window is a fresh budget; re-seed rather than trust the old count.
  if (budget == null || now >= budget.resetAt) {
    budget = null;
    await refreshSearchBudget(headers, fetchImpl);
  }

  if (budget != null && budget.remaining <= RESERVE[priority]) {
    throw new SearchBudgetError(budget.remaining, budget.resetAt);
  }

  // Decrement before awaiting: concurrent callers must see the budget draining
  // as requests are issued, not after they all come back.
  if (budget != null) {
    budget = { ...budget, remaining: budget.remaining - 1 };
  }

  const res = await fetchImpl(url, { headers });
  recordSearchResponse(res);

  if (res.status === 403 || res.status === 429) {
    const resetAt = budget?.resetAt ?? Date.now() + DEFAULT_WINDOW_MS;
    budget = { limit: budget?.limit ?? 30, remaining: 0, resetAt };
    throw new SearchBudgetError(0, resetAt);
  }

  return res;
}
