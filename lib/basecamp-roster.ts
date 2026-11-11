import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type {
  MentionRules,
  RosterPerson,
  RosterPersonPublic,
} from "./checkin-types.js";

const execFileAsync = promisify(execFile);

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_CONCURRENCY = 5;
const CACHE_PATH = () =>
  path.join(process.cwd(), ".cache", "basecamp-roster.json");

interface RosterCache {
  fetchedAt: string;
  people: RosterPerson[];
}

async function runBasecampJson<T>(args: string[]): Promise<T> {
  const { stdout } = await execFileAsync("basecamp", args, {
    timeout: 30_000,
    maxBuffer: 20 * 1024 * 1024,
  });
  const parsed = JSON.parse(stdout) as T & { ok?: boolean; error?: string };
  if (parsed.ok === false) {
    throw new Error(
      `Basecamp CLI failed (${args.join(" ")}): ${parsed.error ?? "unknown error"}`
    );
  }
  return parsed;
}

async function readCache(): Promise<RosterCache | null> {
  try {
    const raw = await readFile(CACHE_PATH(), "utf8");
    const cache = JSON.parse(raw) as RosterCache;
    if (!cache.fetchedAt || !Array.isArray(cache.people)) return null;
    return cache;
  } catch {
    return null;
  }
}

async function writeCache(cache: RosterCache): Promise<void> {
  await mkdir(path.dirname(CACHE_PATH()), { recursive: true });
  await writeFile(CACHE_PATH(), JSON.stringify(cache, null, 2));
}

/** Runs `fn` over `items` with at most `limit` calls in flight. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}

async function fetchRoster(): Promise<RosterPerson[]> {
  const projectId = process.env.BASECAMP_PROJECT_ID;
  if (!projectId) throw new Error("BASECAMP_PROJECT_ID is required");

  const list = await runBasecampJson<{
    data: { id: number; name: string }[];
  }>(["people", "list", "--in", projectId, "--all", "--json"]);

  return mapWithConcurrency(list.data, SHOW_CONCURRENCY, async (person) => {
    const shown = await runBasecampJson<{
      data: { attachable_sgid: string; avatar_url: string };
    }>(["people", "show", String(person.id), "--json"]);
    return {
      id: person.id,
      name: person.name,
      firstName: person.name.trim().split(/\s+/)[0] ?? person.name,
      avatarUrl: shown.data.avatar_url,
      sgid: shown.data.attachable_sgid,
    };
  });
}

/**
 * Project people with the sgid and avatar a mention needs. Cached for 7 days.
 * If the CLI fails and a stale cache exists, the stale cache is returned.
 */
export async function loadRoster(opts?: {
  bust?: boolean;
}): Promise<RosterPerson[]> {
  const cache = await readCache();
  if (
    !opts?.bust &&
    cache &&
    Date.now() - Date.parse(cache.fetchedAt) < CACHE_TTL_MS
  ) {
    return cache.people;
  }

  try {
    const people = await fetchRoster();
    await writeCache({ fetchedAt: new Date().toISOString(), people });
    return people;
  } catch (err) {
    if (cache) return cache.people;
    throw err;
  }
}

/** Drops sgid so the roster can go to the browser. */
export function toPublicRoster(r: RosterPerson[]): RosterPersonPublic[] {
  return r.map(({ id, name, firstName, avatarUrl }) => ({
    id,
    name,
    firstName,
    avatarUrl,
  }));
}

/** Reads config/checkin-mentions.json relative to the working directory. */
export function loadMentionRules(): MentionRules {
  const file = path.join(process.cwd(), "config", "checkin-mentions.json");
  // Synchronous: the file is tiny and this runs inside request handling.
  const parsed = JSON.parse(readFileSync(file, "utf8")) as Partial<MentionRules>;
  return {
    plain: Array.isArray(parsed.plain) ? parsed.plain : [],
    ambiguous: Array.isArray(parsed.ambiguous) ? parsed.ambiguous : [],
  };
}
