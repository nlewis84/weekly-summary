/**
 * Browser-persisted preferences, stored so they survive the dev server moving
 * between ports.
 *
 * `localStorage` is origin-scoped, so `localhost:3001` and `localhost:3002` get
 * separate stores and settings appear to vanish whenever the port changes.
 * Cookies ignore the port, so a single host-scoped cookie is readable from
 * every dev port. The cookie is authoritative because it records the most
 * recent write from any port; `localStorage` is kept in sync as a per-origin
 * cache and as the migration source for values saved before this existed.
 */

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readCookie(key: string): string | null {
  const prefix = `${encodeURIComponent(key)}=`;
  for (const entry of document.cookie.split("; ")) {
    if (!entry.startsWith(prefix)) continue;
    try {
      return decodeURIComponent(entry.slice(prefix.length));
    } catch {
      return null;
    }
  }
  return null;
}

function writeCookie(key: string, value: string) {
  const name = encodeURIComponent(key);
  const encoded = encodeURIComponent(value);
  document.cookie = `${name}=${encoded}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function deleteCookie(key: string) {
  document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`;
}

export function readPref(key: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const shared = readCookie(key);
    if (shared !== null) {
      localStorage.setItem(key, shared);
      return shared;
    }
    const local = localStorage.getItem(key);
    if (local !== null) writeCookie(key, local);
    return local;
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string) {
  if (typeof document === "undefined") return;
  try {
    localStorage.setItem(key, value);
    writeCookie(key, value);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); preferences
    // just fall back to defaults on the next load.
  }
}

export function removePref(key: string) {
  if (typeof document === "undefined") return;
  try {
    localStorage.removeItem(key);
    deleteCookie(key);
  } catch {
    // See writePref.
  }
}
