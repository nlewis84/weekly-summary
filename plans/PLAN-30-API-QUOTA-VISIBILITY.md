# Plan 30: API Quota Visibility

**Status: ✅ Complete** · **Priority: P3** · **Effort: Low** · **Impact: Medium**

## Problem

GitHub and Linear have rate limits. When users hit 403/429, they see a generic error. Showing remaining quota (or "rate limited" state) would set expectations and reduce support burden.

## Tasks

1. [ ] Capture rate limit headers from GitHub/Linear responses (X-RateLimit-Remaining, etc.)
2. [ ] Expose via API or loader: `{ github: { remaining, resetAt }, linear: { ... } }`
3. [ ] Show subtle indicator in UI when low (e.g. "GitHub: 50 requests left") or when rate limited
4. [ ] Optional: warn before refresh when quota is low

## Success Criteria

- User sees when API quota is low or exhausted
- Clear messaging when rate limited (retry-after, etc.)
