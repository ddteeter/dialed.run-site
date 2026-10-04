import { readdirSync, readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { deriveFontsCss, type Tokens } from "@/theme/derive";
import { FONT_FAMILIES, FONT_FILES, familyName } from "@/theme/fonts";
import {
  FONTS_DIR,
  FONTS_OUTPUT,
  FONTS_URL_BASE,
  readThemeSources,
} from "@/theme/sources";

let tokens: Tokens;
beforeAll(async () => {
  ({ tokens } = await readThemeSources());
});

describe("fonts", () => {
  it("fonts.generated.css is exactly what the manifest produces (run `npm run theme`)", () => {
    expect(readFileSync(FONTS_OUTPUT, "utf8")).toBe(
      deriveFontsCss(tokens, FONTS_URL_BASE),
    );
  });

  it("lists every WOFF2 file in design-reference/fonts exactly once", () => {
    const onDisk = readdirSync(FONTS_DIR)
      .filter((f) => f.endsWith(".woff2"))
      .sort();
    expect(FONT_FILES.map((f) => f.file).sort()).toEqual(onDisk);
  });

  it("names each face after the first family in its tokens.js stack", () => {
    const css = deriveFontsCss(tokens, FONTS_URL_BASE);
    expect(css).toContain('font-family: "Archivo Black";');
    expect(css).toContain('font-family: "Archivo";');
    expect(css).toContain('font-family: "IBM Plex Mono";');
    expect(familyName(tokens.FAMILY.display ?? "")).toBe("Archivo Black");
  });

  it("swaps, never blocks", () => {
    const css = deriveFontsCss(tokens, FONTS_URL_BASE);
    expect(css.match(/font-display: swap;/g)?.length).toBe(FONT_FILES.length);
  });

  it("preloads exactly the two above-the-fold faces", () => {
    expect(FONT_FILES.filter((f) => f.preload).map((f) => f.file)).toEqual([
      "archivo-black-latin.woff2",
      "archivo-variable-latin.woff2",
    ]);
  });

  it("credits every family it ships", () => {
    const shipped = new Set(FONT_FILES.map((f) => f.family));
    expect(new Set(FONT_FAMILIES.map((f) => f.family))).toEqual(shipped);
  });
});
