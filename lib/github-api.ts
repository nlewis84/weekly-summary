/**
 * Shared GitHub API helpers. Retries on 403/429 (rate limit) per GitHub ToS.
 */

const MAX_RETRIES = 3;

export async function fetchWithRetry(url: string, init: RequestInit, retryCount = 0): Promise<Response> {
  const res = await fetch(url, init);
  if ((res.status === 403 || res.status === 429) && retryCount < MAX_RETRIES) {
    const reset = res.headers.get("x-ratelimit-reset");
    const retryAfter = res.headers.get("retry-after");
    const waitMs = reset
      ? Math.max(0, parseInt(reset, 10) * 1000 - Date.now())
      : parseInt(retryAfter || "60", 10) * 1000;
    await new Promise((r) => setTimeout(r, Math.min(waitMs, 60_000)));
    return fetchWithRetry(url, init, retryCount + 1);
  }
  return res;
}
