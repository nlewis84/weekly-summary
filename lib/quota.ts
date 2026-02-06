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
  linear: LinearQuota | null;
  error?: string;
}

async function fetchGitHubQuota(): Promise<GitHubQuota | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch("https://api.github.com/rate_limit", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      resources?: {
        core?: { limit: number; remaining: number; reset: number; used: number };
        search?: { limit: number; remaining: number; reset: number; used: number };
      };
    };
    const core = data.resources?.core ?? data.resources?.search;
    if (!core) return null;
    return {
      limit: core.limit,
      remaining: core.remaining,
      resetAt: core.reset ? new Date(core.reset * 1000).toISOString() : null,
      used: core.used,
    };
  } catch {
    return null;
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
    const [github, linear] = await Promise.all([fetchGitHubQuota(), fetchLinearQuota()]);
    return { github, linear };
  } catch (err) {
    return {
      github: null,
      linear: null,
      error: (err as Error).message,
    };
  }
}
