import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import type { Tokens } from "./derive.ts";
import { parseT1, type T1Pair } from "./t1.ts";

// The repo root, from the working directory rather than import.meta.url:
// npm scripts, Vitest and the Astro build all run there, and a bundled
// page's import.meta.url points into dist/.
const root = pathToFileURL(`${process.cwd()}/`);

export const TOKENS_SOURCE = new URL(
  "design-reference/contracts/tokens.js",
  root,
);
export const T1_SOURCE = new URL("design-reference/boards/Theme.dc.html", root);
export const THEME_OUTPUT = new URL("src/styles/theme.generated.css", root);
export const FONTS_OUTPUT = new URL("src/styles/fonts.generated.css", root);
export const FONTS_DIR = new URL("design-reference/fonts/", root);
/** FONTS_DIR as the generated CSS sees it, for Vite to resolve and hash. */
export const FONTS_URL_BASE = "../../design-reference/fonts";

export async function readThemeSources(): Promise<{
  tokens: Tokens;
  pairs: T1Pair[];
}> {
  const tokens = (await import(TOKENS_SOURCE.href)) as Tokens;
  const pairs = parseT1(readFileSync(T1_SOURCE, "utf8"));
  return { tokens, pairs };
}
