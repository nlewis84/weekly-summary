#!/usr/bin/env node
/**
 * Weekly Summary CLI
 * Usage: pnpm cli [check-ins-file]
 *        pnpm cli --today | -t
 *        pnpm cli --yesterday | -y
 *        pnpm cli --week | -w YYYY-MM-DD   # Friday week-ending date
 */

import "dotenv/config";

const nodeVersion = process.version.match(/^v(\d+)/)?.[1];
if (nodeVersion && parseInt(nodeVersion, 10) < 18) {
  console.error("❌ Requires Node.js 18+");
  process.exit(1);
}

import { runSummary, saveWeeklySummary } from "./lib/summary";
import { buildCheckInsFromSnapshots } from "./lib/daily-snapshot";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

const isTodayMode = process.argv.includes("--today") || process.argv.includes("-t");
const isYesterdayMode =
  process.argv.includes("--yesterday") || process.argv.includes("-y");

const weekFlagIndex = process.argv.findIndex(
  (a) => a === "--week" || a === "-w"
);
const weekEndingArg =
  weekFlagIndex >= 0 ? process.argv[weekFlagIndex + 1] : undefined;
if (weekFlagIndex >= 0 && !weekEndingArg) {
  console.error("❌ --week requires a Friday date (YYYY-MM-DD)");
  process.exit(1);
}
if (weekEndingArg && weekEndingArg.startsWith("-")) {
  console.error("❌ --week requires a Friday date (YYYY-MM-DD)");
  process.exit(1);
}

const checkInsFile = process.argv.slice(2).find((a, i, arr) => {
  if (a.startsWith("-")) return false;
  const prev = arr[i - 1];
  if (prev === "--week" || prev === "-w") return false;
  return true;
});

async function readCheckIns(weekEnding?: string): Promise<string> {
  if (checkInsFile) {
    try {
      return readFileSync(checkInsFile, "utf-8");
    } catch (e) {
      console.error(`❌ Error reading file: ${(e as Error).message}`);
      return "";
    }
  }
  if (weekEnding) {
    const fromSnapshots = buildCheckInsFromSnapshots(weekEnding);
    if (fromSnapshots) {
      console.log(
        `\n📋 Using daily snapshots as check-ins for week ending ${weekEnding}`
      );
      return fromSnapshots;
    }
  }
  if (weekEnding || isTodayMode || isYesterdayMode) {
    return "";
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
  const weekEnding = weekEndingArg;
  const checkInsText = await readCheckIns(weekEnding);
  const outputDir = process.cwd() + "/2026-weekly-work-summaries";
  const skipSave = isTodayMode || isYesterdayMode;

  const result = await runSummary({
    todayMode: isTodayMode && !isYesterdayMode && !weekEnding,
    yesterdayMode: isYesterdayMode && !weekEnding,
    weekEnding,
    checkInsText,
    outputDir: skipSave ? null : outputDir,
  });

  console.log(result.terminalOutput);

  if (!skipSave && outputDir) {
    saveWeeklySummary(result.payload, outputDir);
  }
}

main().catch((e) => {
  console.error("❌", (e as Error).message);
  process.exit(1);
});
