import { mkdir, rename } from "node:fs/promises";
import type { AstroIntegration } from "astro";

/** Where the licence report waits for scripts/open-source-list.ts (gitignored). */
export const OSS_REPORT = new URL(
  "../../.oss/oss-license.json",
  import.meta.url,
);

/**
 * Moves Vite's licence report (astro.config.mjs `build.license`) out of
 * dist/, so it's read at postbuild but never published. It can't live in
 * `.vite/`, which Astro deletes after each build.
 */
export function ossReport(): AstroIntegration {
  return {
    name: "dialed:oss-report",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        await mkdir(new URL(".", OSS_REPORT), { recursive: true });
        await rename(new URL("oss-license.json", dir), OSS_REPORT);
      },
    },
  };
}
