import js from "@eslint/js";
import tseslint from "typescript-eslint";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const noHardcodedColors = require("./eslint-rules/no-hardcoded-colors.cjs");

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["build/**", "node_modules/**", ".react-router/**", "2026-weekly-work-summaries/**", "eslint-rules/**"],
  },
  {
    files: ["app/**/*.{ts,tsx}"],
    plugins: { "local": { rules: { "no-hardcoded-colors": noHardcodedColors } } },
    rules: { "local/no-hardcoded-colors": "warn" },
  }
);
