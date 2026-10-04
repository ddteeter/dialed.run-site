import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import astro from "eslint-plugin-astro";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default defineConfig(
  {
    ignores: [
      "dist/",
      ".astro/",
      "node_modules/",
      "design-reference/",
      "test/__snapshots__/",
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".astro"],
      },
    },
  },
  {
    // astro-eslint-parser has no projectService support.
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: { projectService: false, project: "./tsconfig.json" },
    },
    // The type-aware parser sees a template's JSX as an error type, so the
    // no-unsafe-* rules fire on every `{list.map(...)}`. `astro check`
    // type-checks templates properly.
    rules: {
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
