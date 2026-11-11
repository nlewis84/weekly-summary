import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";

type Shot = { path: string; name: string };

const THEME_KEY = "weekly-summary-theme";
const GOALS_KEY = "weekly-summary-goals";
// Goals live only in the browser (cookie/localStorage), so a fresh headless
// browser has none and the rings would not render. Seed placeholder targets.
export const DEFAULT_SCREENSHOT_GOALS = {
  prs_merged: 25,
  pr_reviews: 40,
  linear_completed: 30,
};
const TOTAL_TIMEOUT_MS = 60_000;

function safeDecode(v: string): string {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

/** Raw name/value pairs, still URI-encoded, as the browser sent them. */
function parseCookieHeader(header: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    out.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }
  return out;
}

function macName(d: Date): string {
  const h = d.getHours();
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${h % 12 || 12}.${pad(d.getMinutes())}.${pad(d.getSeconds())}`;
  return `Screenshot ${date} at ${time} ${h < 12 ? "AM" : "PM"}.png`;
}

/**
 * Captures the two weekly-post screenshots (history header + metrics, and the
 * "This week" goal rings card) from the running app. Never throws.
 */
export async function captureWeeklyScreenshots(
  origin: string,
  weekEnding: string,
  /** The Cookie header from Nathan's request, so the rings use his real goals. */
  cookieHeader = "",
): Promise<{ files: Shot[]; error?: string }> {
  const forwarded = parseCookieHeader(cookieHeader);
  const goalsJson =
    forwarded.get(encodeURIComponent(GOALS_KEY)) ??
    encodeURIComponent(JSON.stringify(DEFAULT_SCREENSHOT_GOALS));
  const files: Shot[] = [];
  let browser: { close(): Promise<void> } | undefined;
  let timer: NodeJS.Timeout | undefined;
  const work = async (): Promise<string | undefined> => {
    const dir = path.join(process.cwd(), ".cache", "weekly-shots", weekEnding);
    await mkdir(dir, { recursive: true });
    for (const f of await readdir(dir)) await rm(path.join(dir, f), { force: true, recursive: true });

    const { chromium } = await import("@playwright/test");
    const b = await chromium.launch({ headless: true });
    browser = b;
    const context = await b.newContext({
      colorScheme: "dark",
      deviceScaleFactor: 2,
      viewport: { width: 1454, height: 900 },
    });
    const goals = safeDecode(goalsJson);
    await context.addInitScript(
      ([k, gk, g]: [string, string, string]) => {
        try {
          localStorage.setItem(k, "dark");
          localStorage.setItem(gk, g);
        } catch {
          /* ignore */
        }
      },
      [THEME_KEY, GOALS_KEY, goals] as [string, string, string],
    );
    const host = new URL(origin).hostname;
    forwarded.set(THEME_KEY, "dark");
    forwarded.set(encodeURIComponent(GOALS_KEY), goalsJson);
    await context.addCookies(
      [...forwarded].map(([name, value]) => ({ name, value, domain: host, path: "/" })),
    );
    const page = await context.newPage();
    const now = new Date();
    const clipTo = async (
      el: { x: number; y: number; width: number; height: number },
      file: string,
    ) => {
      const p = path.join(dir, file);
      await page.screenshot({
        path: p,
        fullPage: true,
        clip: { x: el.x, y: el.y, width: el.width, height: el.height },
      });
      files.push({ path: p, name: file });
    };

    // Shot 1: history page
    await page.goto(
      `${origin}/history/${encodeURIComponent(weekEnding)}?_bust=${Date.now()}`,
      { waitUntil: "domcontentloaded" },
    );
    const metrics = page
      .locator("h2", { hasText: /^Metrics$/ })
      .locator("xpath=ancestor::div[contains(@class,'bg-surface')][1]");
    await metrics.waitFor({ timeout: 30_000 });
    await page.getByText("Repos worked on").waitFor({ timeout: 30_000 });
    await page.waitForFunction(
      () => !document.querySelector(".animate-pulse, [class*='skeleton']"),
      undefined,
      { timeout: 15_000 },
    ).catch(() => undefined);
    await page.waitForTimeout(500);
    const back = await page.getByRole("link", { name: "Back to History" }).boundingBox();
    const m = await metrics.boundingBox();
    if (!back || !m) return "history page layout not found";
    const pad = 8;
    const x = Math.max(0, Math.min(back.x, m.x) - pad);
    const y = Math.max(0, back.y - pad);
    const right = m.x + m.width + pad;
    await clipTo(
      { x, y, width: right - x, height: m.y + m.height + pad - y },
      macName(now),
    );

    // Shot 2: dashboard goal rings
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded" });
    const tab = page.getByRole("tab", { name: "This week" });
    await tab.waitFor({ timeout: 30_000 });
    if ((await tab.getAttribute("aria-selected")) !== "true") await tab.click();
    await page.getByText("Linear completed").first().waitFor({ timeout: 30_000 });
    await page.waitForTimeout(1500); // ring animations
    const card = page
      .getByRole("tablist", { name: "Summary period" })
      .locator("xpath=ancestor::div[contains(@class,'bg-surface')][1]");
    const c = await card.boundingBox();
    if (!c) return "goal rings card not found";
    const ringsLabel = await page
      .getByText("Linear completed")
      .first()
      .boundingBox();
    const bottom = ringsLabel ? Math.min(c.y + c.height, ringsLabel.y + ringsLabel.height + 24) : c.y + c.height;
    await clipTo(
      { x: c.x, y: c.y, width: c.width, height: bottom - c.y },
      macName(new Date(now.getTime() + 1000)),
    );
    return undefined;
  };

  try {
    const timeout = new Promise<string>((resolve) => {
      timer = setTimeout(() => resolve("screenshot capture timed out"), TOTAL_TIMEOUT_MS);
    });
    const err = await Promise.race([work(), timeout]);
    return err ? { files, error: err } : { files };
  } catch (e) {
    const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
    return { files, error: msg.slice(0, 200) };
  } finally {
    if (timer) clearTimeout(timer);
    await browser?.close().catch(() => undefined);
  }
}
