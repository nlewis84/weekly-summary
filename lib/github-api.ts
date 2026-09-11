/**
 * Shared GitHub API helpers. Retries on 403/429 (rate limit) per GitHub ToS.
 */

const MAX_RETRIES = 6;
const MAX_WAIT_MS = 90_000;

/**
 * How long to hold off after a rate-limited response.
 *
 * `retry-after` is what GitHub sends on a secondary (burst) limit and is
 * authoritative when present. Only fall back to `x-ratelimit-reset` when the
 * remaining count actually says the primary budget is spent — on a secondary
 * limit that header still points at the top of the hour, and treating it as the
 * wait turns a one-minute pause into a stall.
 */
export function rateLimitWaitMs(
  headers: { get(name: string): string | null },
  now = Date.now()
): number {
  const retryAfter = headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, MAX_WAIT_MS);
  }
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  if (remaining === "0" && reset) {
    const resetMs = Number.parseInt(reset, 10) * 1000;
    if (Number.isFinite(resetMs)) {
      return Math.min(Math.max(0, resetMs - now), MAX_WAIT_MS);
    }
  }
  return 60_000;
}

/**
 * The primary (core) budget, as of the last real response.
 *
 * `/rate_limit` is not a usable source for this: it is served stale often
 * enough to report a full 5,000/5,000 while live responses are already 403ing
 * with `x-ratelimit-remaining: 0`. The headers GitHub puts on every response
 * are the only trustworthy view, so record them as they go by.
 */
export interface CoreBudget {
  limit: number;
  remaining: number;
  used: number;
  /** Epoch ms when the window rolls over. */
  resetAt: number;
}

/**
 * Budgets are per resource. Core, search and GraphQL are counted separately by
 * GitHub, so a spent hourly core budget says nothing about whether a GraphQL
 * query can go out — and the batched reads depend on exactly that being true.
 */
export type RateLimitResource = "core" | "graphql";

const budgets = new Map<RateLimitResource, CoreBudget>();
let refusals = 0;

export function peekCoreBudget(): CoreBudget | null {
  return budgets.get("core") ?? null;
}

export function peekBudget(resource: RateLimitResource): CoreBudget | null {
  return budgets.get(resource) ?? null;
}

/**
 * How many requests this process has refused for a spent budget.
 *
 * Every per-PR fan in this codebase wraps its fetch in `catch { return null }`
 * so one unreachable PR cannot fail a whole summary. That is right for a 404
 * and wrong for exhaustion: it converts "the budget is gone" into "this user
 * has no reviews", and the run then reports a confident zero. Callers compare
 * this counter across a run to tell the two apart.
 */
export function coreRefusalCount(): number {
  return refusals;
}

/** Test helper — module state outlives individual cases. */
export function resetCoreBudget(): void {
  budgets.clear();
  refusals = 0;
}

export function recordCoreResponse(headers?: {
  get(name: string): string | null;
}): void {
  // A real Response always carries headers, but callers hand this whatever
  // their fetch returned; tolerate a shape without them rather than turning a
  // bookkeeping detail into the error the caller sees.
  if (!headers?.get) return;

  // Search carries the same header names against a budget this module does not
  // gate (github-search.ts owns it), so it is ignored here. An absent resource
  // header predates the field and is core in practice.
  const raw = headers.get("x-ratelimit-resource") ?? "core";
  if (raw !== "core" && raw !== "graphql") return;
  const resource: RateLimitResource = raw;

  const remaining = Number.parseInt(
    headers.get("x-ratelimit-remaining") ?? "",
    10
  );
  if (!Number.isFinite(remaining)) return;
  const limit = Number.parseInt(headers.get("x-ratelimit-limit") ?? "", 10);
  const used = Number.parseInt(headers.get("x-ratelimit-used") ?? "", 10);
  const reset = Number.parseInt(headers.get("x-ratelimit-reset") ?? "", 10);

  budgets.set(resource, {
    limit: Number.isFinite(limit) ? limit : 5000,
    remaining,
    used: Number.isFinite(used) ? used : 0,
    resetAt: Number.isFinite(reset) ? reset * 1000 : Date.now() + 3_600_000,
  });
}

export class RateLimitExhaustedError extends Error {
  readonly resetAt: number;
  readonly limit: number;
  constructor(resetAt: number, limit: number) {
    const seconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
    const minutes = Math.ceil(seconds / 60);
    super(
      `GitHub hourly budget exhausted (${limit} requests used); resets in ${minutes} min`
    );
    this.name = "RateLimitExhaustedError";
    this.resetAt = resetAt;
    this.limit = limit;
  }
}

/**
 * Is the primary budget known-spent, with the window still closed?
 *
 * Deliberately only true on a *recorded* zero. An unknown budget is optimistic
 * so a cold process still makes its first request.
 */
function exhaustedUntil(
  resource: RateLimitResource,
  now = Date.now()
): CoreBudget | null {
  const budget = budgets.get(resource);
  if (!budget) return null;
  if (budget.remaining > 0) return null;
  if (now >= budget.resetAt) return null;
  return budget;
}

export interface FetchOptions {
  /** Which budget this request draws on. Defaults to core. */
  resource?: RateLimitResource;
  retryCount?: number;
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: FetchOptions = {}
): Promise<Response> {
  const { resource = "core", retryCount = 0 } = options;
  // Refuse locally instead of spending a round trip, and another backoff, on a
  // budget already known to be empty. These fans are hundreds of requests
  // wide: without this gate each one sleeps out its own MAX_RETRIES, so a run
  // that cannot possibly succeed takes hours to admit it and the UI just shows
  // a spinner. Failing the whole run at once is what surfaces an error.
  const known = exhaustedUntil(resource);
  if (known) {
    refusals += 1;
    throw new RateLimitExhaustedError(known.resetAt, known.limit);
  }

  const res = await fetch(url, init);
  recordCoreResponse(res.headers);

  if ((res.status === 403 || res.status === 429) && retryCount < MAX_RETRIES) {
    // A spent hourly budget is not a transient burst. The real wait is whatever
    // is left of the hour, which MAX_WAIT_MS will not sleep — so retrying only
    // cycles six 90s naps to the same failure, and leaves a crowd of sleepers
    // that all wake at the reset and drain the new window immediately. Fail now
    // and report when it reopens.
    const spent = exhaustedUntil(resource);
    if (spent) {
      refusals += 1;
      throw new RateLimitExhaustedError(spent.resetAt, spent.limit);
    }

    // Jitter so a bounded fan-out does not re-collide the instant the window
    // reopens and immediately spend itself back into the same limit.
    const waitMs = rateLimitWaitMs(res.headers) + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, waitMs));
    return fetchWithRetry(url, init, { resource, retryCount: retryCount + 1 });
  }
  return res;
}
