#!/usr/bin/env node
/**
 * Transcript → JSON + MD CLI
 * Usage: pnpm cli:transcript [path-to-transcript.md]
 *        pnpm cli:transcript --batch
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { parseTranscriptToPayload } from "../lib/transcript-parse.js";
import { buildMarkdownSummary } from "../lib/markdown.js";

const BATCH_WEEKS = ["2026-01-02", "2026-01-09", "2026-01-16", "2026-01-23"];
const SKIP_WEEK = "2026-01-30"; // Context only for 2026-01-31

function getOutputDir(): string {
  return resolve(process.cwd(), "2026-weekly-work-summaries");
}

function processTranscript(content: string, outputDir: string): boolean {
  const payload = parseTranscriptToPayload(content);
  if (!payload) {
    console.error("Could not parse week_ending from transcript");
    return false;
  }

  const weekEnding = payload.meta.week_ending;
  if (weekEnding === SKIP_WEEK) {
    console.log(`Skipping ${weekEnding} (context only for 2026-01-31)`);
    return true;
  }

  const jsonPath = join(outputDir, `${weekEnding}.json`);
  const mdPath = join(outputDir, `${weekEnding}.md`);

  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf-8");
  writeFileSync(mdPath, buildMarkdownSummary(payload), "utf-8");

  console.log(`✓ ${weekEnding}.json`);
  console.log(`✓ ${weekEnding}.md`);
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const isBatch = args.includes("--batch");
  const outputDir = getOutputDir();

  if (isBatch) {
    for (const week of BATCH_WEEKS) {
      const transcriptPath = join(outputDir, `${week}-week-in-review.md`);
      try {
        const content = readFileSync(transcriptPath, "utf-8");
        processTranscript(content, outputDir);
      } catch (e) {
        console.error(`Error processing ${week}:`, (e as Error).message);
      }
    }
    return;
  }

  const inputPath = args.find((a) => !a.startsWith("-"));
  if (!inputPath) {
    console.error("Usage: pnpm cli:transcript <path-to-transcript.md>");
    console.error("       pnpm cli:transcript --batch");
    process.exit(1);
  }

  const resolved = resolve(process.cwd(), inputPath);
  const content = readFileSync(resolved, "utf-8");
  const ok = processTranscript(content, outputDir);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error("Error:", (e as Error).message);
  process.exit(1);
});
