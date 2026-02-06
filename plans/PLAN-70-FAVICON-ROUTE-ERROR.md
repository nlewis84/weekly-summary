# Plan 70: Fix "No route matches URL /favicon.ico" Error

**Status:** ✅ Complete · **Priority: P3** · **Effort: Trivial** · **Impact: Low**

**Created Feb 2026:** Resolve the error that occurs when the browser requests `/favicon.ico` during development. Browsers automatically request this URL when loading a page; React Router treats it as a route and throws because no route matches.

## Problem

When running `yarn dev` (or `pnpm dev`), the browser requests `/favicon.ico`. React Router's dev server handles all requests and tries to match them as routes. Since there is no route for `/favicon.ico`, it throws:

```
Error: No route matches URL "/favicon.ico"
    at getInternalRouterError (...)
No routes matched location "/favicon.ico"
```

This clutters the terminal and can confuse developers. The app works, but the error is noisy.

## Root Cause

1. Browsers request `/favicon.ico` by default when no favicon is explicitly set in the HTML.
2. The project has no `public/` folder and no favicon file.
3. React Router dev server routes all requests through its handler; unmatched paths throw instead of returning 404.

## Affected Files

| File | Role |
|------|------|
| `app/root.tsx` | `links` function is empty; no favicon link in HTML |
| (new) `public/` | Vite serves static assets from here at root path `/` |
| (new) `public/favicon.ico` | Favicon file served at `/favicon.ico` |

## Solution Approach

**Recommended: Use Vite's `public` directory**

Vite serves files from `public/` at the root during dev and copies them to the build output. The React Router dev server is built on Vite, so static files in `public/` should be served before the route handler. This is the standard approach for favicon, robots.txt, etc.

### 1. Create `public/` and add favicon

- Create `public/` directory at project root.
- Add `favicon.ico` (16×16 or 32×32 ICO, or a minimal placeholder).
- Vite will serve `/favicon.ico` from `public/favicon.ico`.

### 2. Optionally add explicit favicon link in root

In `app/root.tsx`, update the `links` function to explicitly reference the favicon:

```ts
export const links: LinksFunction = () => [
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
];
```

This ensures the browser uses the correct path and can help with PWA/manifest consistency. The PWA manifest in `vite.config.ts` does not currently specify an icon; adding one could be a follow-up.

### Alternative: Resource route (not recommended)

Create a route like `app/routes/favicon[.]ico.ts` that returns the favicon. This would require importing or reading a favicon file and returning it with correct headers. More complex and couples routing to static asset serving. Prefer the `public/` approach.

## Tasks

1. [x] Create `public/` directory
2. [x] Add `favicon.ico` (use existing app branding—e.g. ChartBar icon or primary color #17B582)
3. [x] Optionally: Add favicon link in `app/root.tsx` `links` function
4. [x] Verify: Run `yarn dev`, load http://localhost:3001, confirm no favicon error in terminal
5. [x] Verify: Favicon appears in browser tab

## Notes

- If `public/favicon.ico` does not resolve the error (e.g. React Router dev server handles all requests before Vite static middleware), the fallback is a resource route that returns the favicon with appropriate `Content-Type: image/x-icon` headers.
- The VitePWA plugin already includes `ico` in `globPatterns`; favicon will be cached for offline use once added.
