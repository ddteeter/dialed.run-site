import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const DIST = new URL("../../dist/", import.meta.url).pathname;

if (!existsSync(DIST)) {
  throw new Error("dist/ is missing: run `npm run build:fixture` first");
}

export function readDist(path: string): string {
  return readFileSync(join(DIST, path), "utf8");
}

/** Every built HTML page, as a path relative to dist/. */
export function htmlPages(dir = DIST, prefix = ""): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = prefix + entry.name;
    if (entry.isDirectory()) return htmlPages(join(dir, entry.name), `${rel}/`);
    return entry.name.endsWith(".html") ? [rel] : [];
  });
}

export function cssFiles(): string[] {
  return readdirSync(join(DIST, "_astro")).filter((f) => f.endsWith(".css"));
}
