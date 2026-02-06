#!/usr/bin/env node
/**
 * Weekly Summary CLI
 * Usage: pnpm cli [check-ins-file]
 *        pnpm cli --today | -t
 *        pnpm cli --yesterday | -y
 */

import "dotenv/config";

const nodeVersion = process.version.match(/^v(\d+)/)?.[1];
if (nodeVersion && parseInt(nodeVersion, 10) < 18) {
  console.error("❌ Requires Node.js 18+");
  process.exit(1);
}

import { runSummary, saveWeeklySummary } from "./lib/summary";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

const isTodayMode = process.argv.includes("--today") || process.argv.includes("-t");
const isYesterdayMode = process.argv.includes("--yesterday") || process.argv.includes("-y");
const checkInsFile = process.argv.slice(2).find((a) => !a.startsWith("-"));

async function readCheckIns(): Promise<string> {
  if (checkInsFile) {
    try {
      return readFileSync(checkInsFile, "utf-8");
    } catch (e) {
      console.error(`❌ Error reading file: ${(e as Error).message}`);
      return "";
    }
  }
  if (!stdin.isTTY) {
    let input = "";
    for await (const chunk of stdin) {
      input += chunk;
    }
    return input;
  }
  const rl = createInterface({ input: stdin, output: stdout });
  console.log("\n📝 Enter check-ins (Ctrl+D when done):\n");
  const lines: string[] = [];
  for await (const line of rl) {
    lines.push(line);
  }
  return lines.join("\n");
}

async function main() {
  const checkInsText = await readCheckIns();
  const outputDir = process.cwd() + "/2026-weekly-work-summaries";

  const result = await runSummary({
    todayMode: isTodayMode && !isYesterdayMode,
    yesterdayMode: isYesterdayMode,
    checkInsText,
    outputDir: isTodayMode || isYesterdayMode ? null : outputDir,
  });

  console.log(result.terminalOutput);

  if (!isTodayMode && outputDir) {
    saveWeeklySummary(result.payload, outputDir);
  }
}

main().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(1);
});
