/**
 * Writes src/styles/theme.generated.css and fonts.generated.css from
 * tokens.js, the T1 table and the font manifest. Run with `npm run theme`;
 * see src/theme/derive.ts and src/theme/fonts.ts.
 */
import { writeFileSync } from "node:fs";
import {
  FONTS_OUTPUT,
  FONTS_URL_BASE,
  readThemeSources,
  THEME_OUTPUT,
} from "../src/theme/sources.ts";
import { deriveFontsCss, deriveThemeCss } from "../src/theme/derive.ts";

const { tokens, pairs } = await readThemeSources();
writeFileSync(THEME_OUTPUT, deriveThemeCss(tokens, pairs));
writeFileSync(FONTS_OUTPUT, deriveFontsCss(tokens, FONTS_URL_BASE));
console.log(`wrote ${THEME_OUTPUT.pathname}\nwrote ${FONTS_OUTPUT.pathname}`);
