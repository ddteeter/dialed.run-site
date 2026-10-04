import { readFileSync } from "node:fs";
import type { Tokens } from "./derive.ts";
import { parseT1, type T1Pair } from "./t1.ts";

const root = new URL("../../", import.meta.url);

export const TOKENS_SOURCE = new URL(
  "design-reference/contracts/tokens.js",
  root,
);
export const T1_SOURCE = new URL("design-reference/boards/Theme.dc.html", root);
export const THEME_OUTPUT = new URL("src/styles/theme.generated.css", root);

export async function readThemeSources(): Promise<{
  tokens: Tokens;
  pairs: T1Pair[];
}> {
  const tokens = (await import(TOKENS_SOURCE.href)) as Tokens;
  const pairs = parseT1(readFileSync(T1_SOURCE, "utf8"));
  return { tokens, pairs };
}
