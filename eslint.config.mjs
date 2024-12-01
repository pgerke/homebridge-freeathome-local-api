import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      "**/.github",
      "**/.vscode",
      "**/coverage",
      "**/dist",
      "**/tsc-out",
      "**/node_modules",
      "package-lock.json",
      "eslint.config.mjs",
    ],
  },
  ...compat.extends(
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:prettier/recommended"
  ),
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",

      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.spec.json"],
      },
    },

    rules: {
      "prettier/prettier": [
        "error",
        {
          singleQuote: false,
        },
      ],

      indent: [
        "warn",
        2,
        {
          SwitchCase: 1,
        },
      ],

      "max-len": ["warn", 140],
      "no-console": ["warn"], // use the provided Homebridge log method instead
    },
  },
];
