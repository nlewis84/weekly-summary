# Plan 11: Security & Secrets

**Status: ✅ Complete**

## Problem

Ensure API keys and tokens are never exposed to the client.

## Tasks

1. [ ] Audit: ensure LINEAR_API_KEY, GITHUB_TOKEN only used server-side (loaders, actions)
2. [ ] No env vars in client bundle
3. [ ] .env in .gitignore (verify)
4. [ ] Consider: rate limiting for API routes if public
5. [ ] Document security best practices in README

## Success Criteria

- No secrets in client JS
- .env never committed

---

## Resolution

- Audit: LINEAR_API_KEY, GITHUB_TOKEN, GITHUB_USERNAME, GITHUB_REPO, GITHUB_SUMMARY_PATHS only used in lib/summary, lib/github-fetch, lib/github-persist, api.* routes, and route loaders (server-side only)
- .env in .gitignore (verified)
- README: added Security section with best practices
