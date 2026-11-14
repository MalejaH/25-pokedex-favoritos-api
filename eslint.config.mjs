import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "no-console": "error",
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-nested-ternary": "error",
      "no-param-reassign": "error",
      "no-return-await": "error",
      "no-unneeded-ternary": "error",
      "prefer-const": "error",
      "prefer-template": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "complexity": ["error", 10],
      "max-depth": ["error", 3],
      "max-lines": ["error", 300],
      "max-lines-per-function": [
        "error",
        { max: 50, skipBlankLines: true, skipComments: true },
      ],
      "max-params": ["error", 4],
      "max-statements": ["error", 20],
      "max-nested-callbacks": ["error", 3],
      "spaced-comment": ["error", "always"],
      "object-shorthand": ["error", "always"],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
  ]),
]);
