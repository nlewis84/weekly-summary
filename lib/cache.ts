/**
 * In-memory cache for API responses.
 * Reduces request burn on Linear/GitHub by serving cached data for 15 minutes.
 * Use _bust query param or CACHE_TTL_MS=0 to bypass/disable.
 */

const DEFAULT_TTL_MS = 15 * 60 * 1000; // 15 minutes

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

function createCache<T>(ttlMs: number) {
  const store = new Map<string, CacheEntry<T>>();

  return {
    get(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() >= entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return entry.data;
    },

    set(key: string, data: T, customTtlMs?: number): void {
      const ttl = customTtlMs ?? ttlMs;
      store.set(key, {
        data,
        expiresAt: Date.now() + ttl,
      });
    },

    bust(key: string): void {
      store.delete(key);
    },

    bustAll(): void {
      store.clear();
    },
  };
}

const ttlMs =
  process.env.CACHE_TTL_MS !== undefined && process.env.CACHE_TTL_MS !== ""
    ? Number(process.env.CACHE_TTL_MS)
    : DEFAULT_TTL_MS;
export const dataCache = createCache<unknown>(ttlMs);
