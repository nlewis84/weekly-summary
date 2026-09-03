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

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retryCount = 0
): Promise<Response> {
  const res = await fetch(url, init);
  if ((res.status === 403 || res.status === 429) && retryCount < MAX_RETRIES) {
    // Jitter so a bounded fan-out does not re-collide the instant the window
    // reopens and immediately spend itself back into the same limit.
    const waitMs = rateLimitWaitMs(res.headers) + Math.random() * 1000;
    await new Promise((r) => setTimeout(r, waitMs));
    return fetchWithRetry(url, init, retryCount + 1);
  }
  return res;
}
