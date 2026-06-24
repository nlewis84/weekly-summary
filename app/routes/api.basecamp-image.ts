import type { LoaderFunctionArgs } from "react-router";
import { execFile } from "node:child_process";

const ALLOWED_HOSTS = [
  "preview.3.basecamp.com",
  "storage.3.basecamp.com",
  "preview.app.basecamp.com",
  "storage.app.basecamp.com",
];

/** Avoid dozens of parallel `basecamp` processes (timeouts, flaky exit 6/7). */
const BASECAMP_DOWNLOAD_CONCURRENCY = 4;

function createConcurrencyLimiter(concurrency: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  return async function limit<T>(fn: () => Promise<T>): Promise<T> {
    await new Promise<void>((resolve) => {
      const acquire = () => {
        active++;
        resolve();
      };
      if (active < concurrency) acquire();
      else queue.push(acquire);
    });
    try {
      return await fn();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
}

const limitBasecampDownload = createConcurrencyLimiter(
  BASECAMP_DOWNLOAD_CONCURRENCY
);

function downloadToBuffer(storageUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    execFile(
      "basecamp",
      ["files", "download", storageUrl, "--out", "-"],
      {
        maxBuffer: 20 * 1024 * 1024,
        timeout: 90_000,
        encoding: "buffer",
      },
      (err, stdout, stderr) => {
        if (err) {
          const errText =
            stderr instanceof Buffer
              ? stderr.toString("utf8").trim()
              : String(stderr ?? "").trim();
          if (errText) console.error("basecamp files download stderr:", errText);
          return reject(err);
        }
        resolve(stdout as Buffer);
      }
    );
  });
}

function guessContentType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  if (lower.includes(".gif")) return "image/gif";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".svg")) return "image/svg+xml";
  return "image/png";
}

export async function loader({ request }: LoaderFunctionArgs) {
  const reqUrl = new URL(request.url);
  const target = reqUrl.searchParams.get("url");

  if (!target) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  try {
    const buf = await limitBasecampDownload(() => downloadToBuffer(target));
    if (buf.length === 0) {
      return new Response("Empty response", { status: 502 });
    }

    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": guessContentType(target),
        "Content-Length": String(buf.length),
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Basecamp image proxy error:", err);
    return new Response("Proxy error", { status: 502 });
  }
}
