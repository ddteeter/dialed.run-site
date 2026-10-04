/**
 * The self-hosted fonts: the WOFF2 files in design-reference/fonts, which
 * are the files the app ships. Family names come from tokens.js FAMILY (the
 * first name in each stack), so a face can't drift from the stack that
 * asks for it. The unicode ranges are the app's (src/ui/fonts.css), which
 * are Google Fonts' latin and latin-ext subsets.
 *
 * scripts/generate-theme.ts writes src/styles/fonts.generated.css from this,
 * BaseLayout preloads the faces marked `preload`, and /open-source lists
 * FONT_FAMILIES.
 */
export const LATIN =
  "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD";
export const LATIN_EXT =
  "U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF";

export type FamilyKey = "display" | "text" | "mono";

export interface FontFile {
  family: FamilyKey;
  /** A single weight, or a variable font's range ("100 900"). */
  weight: string;
  file: string;
  subset: "latin" | "latin-ext";
  /** Used above the fold on every page (HANDOFF §5: preload two). */
  preload?: true;
}

export const FONT_FILES: readonly FontFile[] = [
  {
    family: "display",
    weight: "400",
    file: "archivo-black-latin.woff2",
    subset: "latin",
    preload: true,
  },
  {
    family: "display",
    weight: "400",
    file: "archivo-black-latin-ext.woff2",
    subset: "latin-ext",
  },
  {
    family: "text",
    weight: "100 900",
    file: "archivo-variable-latin.woff2",
    subset: "latin",
    preload: true,
  },
  {
    family: "text",
    weight: "100 900",
    file: "archivo-variable-latin-ext.woff2",
    subset: "latin-ext",
  },
  {
    family: "mono",
    weight: "400",
    file: "ibm-plex-mono-400-latin.woff2",
    subset: "latin",
  },
  {
    family: "mono",
    weight: "400",
    file: "ibm-plex-mono-400-latin-ext.woff2",
    subset: "latin-ext",
  },
  {
    family: "mono",
    weight: "500",
    file: "ibm-plex-mono-500-latin.woff2",
    subset: "latin",
  },
  {
    family: "mono",
    weight: "500",
    file: "ibm-plex-mono-500-latin-ext.woff2",
    subset: "latin-ext",
  },
];

export interface FontFamilyCredit {
  family: FamilyKey;
  licence: "OFL-1.1";
  source: string;
}

export const FONT_FAMILIES: readonly FontFamilyCredit[] = [
  {
    family: "display",
    licence: "OFL-1.1",
    source: "https://github.com/Omnibus-Type/ArchivoBlack",
  },
  {
    family: "text",
    licence: "OFL-1.1",
    source: "https://github.com/Omnibus-Type/Archivo",
  },
  { family: "mono", licence: "OFL-1.1", source: "https://github.com/IBM/plex" },
];

/** "'Archivo Black', Archivo, Helvetica, sans-serif" → "Archivo Black". */
export function familyName(stack: string): string {
  const first = stack.split(",")[0]?.trim() ?? "";
  const name = first.replace(/^['"]|['"]$/g, "");
  if (name === "")
    throw new Error(`no family name in ${JSON.stringify(stack)}`);
  return name;
}

/** `urlBase` is the fonts directory relative to the generated CSS file. */
export function fontFaceCss(
  files: readonly FontFile[],
  family: Record<FamilyKey, string>,
  urlBase: string,
): string {
  return files
    .map((font) =>
      [
        "@font-face {",
        `  font-family: "${familyName(family[font.family])}";`,
        "  font-style: normal;",
        `  font-weight: ${font.weight};`,
        "  font-display: swap;",
        `  src: url("${urlBase}/${font.file}") format("woff2");`,
        `  unicode-range: ${font.subset === "latin" ? LATIN : LATIN_EXT};`,
        "}",
      ].join("\n"),
    )
    .join("\n\n");
}
