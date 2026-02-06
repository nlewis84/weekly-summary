import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedCss: string | null = null;

/** Paths to check for built CSS (prod vs dev, different cwd) */
const ASSET_PATHS = [
  join(process.cwd(), "build/client/assets"),
  join(__dirname, "../client/assets"),
  join(process.cwd(), "dist/client/assets"),
];

/** Read built CSS and cache it. Used by SSR to inline styles and prevent FOUC. */
export function getInlineCss(): string {
  if (cachedCss) return cachedCss;
  for (const assetsDir of ASSET_PATHS) {
    try {
      if (!existsSync(assetsDir)) continue;
      const files = readdirSync(assetsDir);
      const cssFile = files.find((f) => f.startsWith("root-") && f.endsWith(".css"));
      if (cssFile) {
        cachedCss = readFileSync(join(assetsDir, cssFile), "utf-8");
        return cachedCss;
      }
    } catch {
      continue;
    }
  }
  return "";
}
