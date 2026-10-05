/**
 * Reads the T1 colour table out of design-reference/boards/Theme.dc.html.
 *
 * The board keeps T1 as rows of a JS array literal in its component script:
 *   ['Ground', '--ground', '#F4F3EF', '#0B0B0E', 'The screen. …'],
 * Each row is one CSS variable with a light and a dark value. The parser is
 * strict: a row it can't read fails, rather than dropping a colour.
 */
export interface T1Pair {
  role: string;
  /** The CSS variable, with its leading dashes: "--ground". */
  token: string;
  light: string;
  dark: string;
}

const STRING = String.raw`'((?:[^'\\]|\\.)*)'`;
const HEX = String.raw`'(#[0-9A-Fa-f]{6})'`;
const ROW = new RegExp(
  String.raw`\[\s*${STRING}\s*,\s*'(--[a-z0-9-]+)'\s*,\s*${HEX}\s*,\s*${HEX}\s*,\s*${STRING}\s*\]`,
  "g",
);

export function parseT1(html: string): T1Pair[] {
  const start = html.indexOf("const pairs = [");
  const end = start === -1 ? -1 : html.indexOf("].map(", start);
  if (start === -1 || end === -1) {
    throw new Error("T1: no `const pairs = [ … ].map(` block in Theme.dc.html");
  }
  const block = html.slice(start + "const pairs = [".length, end);

  const pairs = [...block.matchAll(ROW)].map(
    ([, role = "", token = "", light = "", dark = ""]) => ({
      role: role.replaceAll("\\'", "'"),
      token,
      light: light.toUpperCase(),
      dark: dark.toUpperCase(),
    }),
  );

  const rowStarts = block.match(/\[\s*'/g)?.length ?? 0;
  if (pairs.length === 0 || pairs.length !== rowStarts) {
    throw new Error(
      `T1: read ${String(pairs.length)} of ${String(rowStarts)} rows; a row isn't [role, --token, #light, #dark, note]`,
    );
  }
  const seen = new Set<string>();
  for (const { token } of pairs) {
    if (seen.has(token)) throw new Error(`T1: ${token} appears twice`);
    seen.add(token);
  }
  return pairs;
}
