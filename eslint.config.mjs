import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "lib/generated/**",
  ]),
  {
    rules: {
      // IMAP/nodemailer/mailparser callbacks genuinely require any
      "@typescript-eslint/no-explicit-any": "warn",
      // Unused vars are warnings, not errors
      "@typescript-eslint/no-unused-vars": "warn",
      // setState in effect is intentional for dialog reset patterns
      "react-hooks/set-state-in-effect": "warn",
      // Missing exhaustive deps — these are intentional in most cases here
      "react-hooks/exhaustive-deps": "warn",
      // prefer-const is a style suggestion, not a bug
      "prefer-const": "warn",
    },
  },
]);

export default eslintConfig;
