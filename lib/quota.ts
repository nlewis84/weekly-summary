/**
 * API quota visibility - GitHub and Linear rate limits.
 */

export interface GitHubQuota {
  limit: number;
  remaining: number;
  resetAt: string | null;
  used: number;
}

export interface LinearQuota {
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
}

export interface QuotaStatus {
  github: GitHubQuota | null;
  /**
   * The search budget — 30 requests a minute, tracked apart from core. It is
   * the limit this app actually runs into, so it is reported separately rather
   * than hidden behind core's far roomier 5,000/hour.
   */
  githubSearch: GitHubQuota | null;
  linear: LinearQuota | null;
  error?: string;
}

async function fetchGitHubQuota(): Promise<{
  core: GitHubQuota | null;
  search: GitHubQuota | null;
}> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { core: null, search: null };

  try {
    // Free to call: /rate_limit does not count against any rate limit.
    const res = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) return { core: null, search: null };
    const data = (await res.json()) as {
      resources?: {
        core?: { limit: number; remaining: number; reset: number; used: number };
        search?: { limit: number; remaining: number; reset: number; used: number };
      };
    };
    const shape = (
      r?: { limit: number; remaining: number; reset: number; used: number }
    ): GitHubQuota | null =>
      r
        ? {
            limit: r.limit,
            remaining: r.remaining,
            resetAt: r.reset ? new Date(r.reset * 1000).toISOString() : null,
            used: r.used,
          }
        : null;
    return {
      core: shape(data.resources?.core),
      search: shape(data.resources?.search),
    };
  } catch {
    return { core: null, search: null };
  }
}

async function fetchLinearQuota(): Promise<LinearQuota | null> {
  const key = process.env.LINEAR_API_KEY;
  if (!key) return null;

  try {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: key,
      },
      body: JSON.stringify({ query: "query { viewer { id } }" }),
    });

    const limit = res.headers.get("X-RateLimit-Requests-Limit");
    const remaining = res.headers.get("X-RateLimit-Requests-Remaining");
    const reset = res.headers.get("X-RateLimit-Requests-Reset");

    return {
      limit: limit != null ? parseInt(limit, 10) : null,
      remaining: remaining != null ? parseInt(remaining, 10) : null,
      resetAt: reset ? new Date(parseInt(reset, 10)).toISOString() : null,
    };
  } catch {
    return null;
  }
}

export async function getQuotaStatus(): Promise<QuotaStatus> {
  try {
    const [gh, linear] = await Promise.all([
      fetchGitHubQuota(),
      fetchLinearQuota(),
    ]);
    return { github: gh.core, githubSearch: gh.search, linear };
  } catch (err) {
    return {
      github: null,
      githubSearch: null,
      linear: null,
      error: (err as Error).message,
    };
  }
}
