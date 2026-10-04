/**
 * Writes src/styles/theme.generated.css from tokens.js and the T1 table.
 * Run with `npm run theme`; see src/theme/derive.ts.
 */
import { writeFileSync } from "node:fs";
import { readThemeSources, THEME_OUTPUT } from "../src/theme/sources.ts";
import { deriveThemeCss } from "../src/theme/derive.ts";

const { tokens, pairs } = await readThemeSources();
writeFileSync(THEME_OUTPUT, deriveThemeCss(tokens, pairs));
console.log(`wrote ${THEME_OUTPUT.pathname}`);
