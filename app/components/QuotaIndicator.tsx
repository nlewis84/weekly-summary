import { useEffect, useState } from "react";

interface GitHubQuota {
  limit: number;
  remaining: number;
  resetAt: string | null;
  used: number;
}

interface LinearQuota {
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
}

interface QuotaStatus {
  github: GitHubQuota | null;
  linear: LinearQuota | null;
  error?: string;
}

const LOW_THRESHOLD = 100;

function formatReset(resetAt: string | null): string {
  if (!resetAt) return "";
  const d = new Date(resetAt);
  const now = new Date();
  const mins = Math.ceil((d.getTime() - now.getTime()) / 60_000);
  if (mins <= 0) return "resetting soon";
  if (mins < 60) return `resets in ${mins}m`;
  return `resets ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

export function QuotaIndicator() {
  const [quota, setQuota] = useState<QuotaStatus | null>(null);

  useEffect(() => {
    fetch("/api/quota")
      .then((r) => r.json())
      .then(setQuota)
      .catch(() => setQuota(null));
  }, []);

  if (!quota || (!quota.github && !quota.linear)) return null;

  const gh = quota.github;
  const lin = quota.linear;
  const ghLow = gh && gh.remaining < LOW_THRESHOLD;
  const linLow = lin && lin.remaining != null && lin.remaining < LOW_THRESHOLD;

  return (
    <div className="mt-4 pt-4 border-t border-(--color-border) space-y-2">
      <h4 className="text-sm font-medium text-(--color-text)">API quota</h4>
      <div className="flex flex-wrap gap-4 text-xs">
        {gh && (
          <span
            className={ghLow ? "text-amber-600 dark:text-amber-400" : "text-text-muted"}
            title={`GitHub: ${gh.remaining} of ${gh.limit} remaining. ${formatReset(gh.resetAt)}`}
          >
            GitHub: {gh.remaining} left
            {ghLow && " (low)"}
          </span>
        )}
        {lin && lin.remaining != null && (
          <span
            className={linLow ? "text-amber-600 dark:text-amber-400" : "text-text-muted"}
            title={`Linear: ${lin.remaining} of ${lin.limit ?? "?"} remaining. ${formatReset(lin.resetAt)}`}
          >
            Linear: {lin.remaining} left
            {linLow && " (low)"}
          </span>
        )}
      </div>
    </div>
  );
}
