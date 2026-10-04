import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { deriveThemeCss, type Tokens } from "@/theme/derive";
import { readThemeSources, THEME_OUTPUT, T1_SOURCE } from "@/theme/sources";
import { parseT1, type T1Pair } from "@/theme/t1";

let tokens: Tokens;
let pairs: T1Pair[];
let css: string;

beforeAll(async () => {
  ({ tokens, pairs } = await readThemeSources());
  css = deriveThemeCss(tokens, pairs);
});

/** The body of the first `selector { … }` block, for scoped assertions. */
function blockOf(source: string, selector: string): string {
  const start = source.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`no ${selector} block`);
  return source.slice(start, source.indexOf("\n}", start));
}

describe("theme.generated.css", () => {
  it("is exactly what tokens.js and T1 produce (run `npm run theme`)", () => {
    expect(readFileSync(THEME_OUTPUT, "utf8")).toBe(css);
  });

  it("carries tokens.js CSS_VARS verbatim", () => {
    expect(css).toContain(tokens.CSS_VARS);
  });

  it("gives every type and mono step its size, line-height, tracking and case", () => {
    for (const [prefix, steps] of [
      ["type", tokens.TYPE],
      ["mono", tokens.MONO],
      ["type", tokens.MARKETING],
    ] as const) {
      for (const [key, step] of Object.entries(steps)) {
        const utility = blockOf(css, `@utility ${prefix}-${key}`);
        const size =
          typeof step.size === "number" ? `${String(step.size)}px` : step.size;
        expect(utility).toContain(`font-size: ${size};`);
        expect(utility).toContain(`line-height: ${String(step.lineHeight)};`);
        expect(utility).toContain(`font-family: var(--font-${step.family});`);
        expect(utility).toContain(`text-transform: ${step.transform};`);
        const track =
          prefix === "type" ? `--track-${key}` : `--track-mono-${key}`;
        expect(utility).toContain(`letter-spacing: var(${track});`);
        expect(css).toContain(`${track}: ${String(step.tracking)}em;`);
      }
    }
  });

  it("maps spacing, heights, radii, breakpoints and measures into the Tailwind theme", () => {
    const theme = blockOf(css, "@theme inline");
    for (const [key, value] of Object.entries(tokens.SPACE)) {
      expect(theme).toContain(`--spacing-${key}: ${String(value)}px;`);
    }
    for (const [key, value] of Object.entries(tokens.HEIGHT)) {
      expect(theme).toContain(`--spacing-${key}: ${String(value)}px;`);
    }
    for (const [key, value] of Object.entries(tokens.RADIUS)) {
      expect(theme).toContain(`--radius-${key}: ${String(value)}px;`);
    }
    for (const [key, value] of Object.entries(tokens.BREAKPOINT)) {
      expect(theme).toContain(`--breakpoint-${key}: ${String(value)}px;`);
    }
    for (const [key, value] of Object.entries(tokens.MEASURE)) {
      expect(theme).toContain(`--container-${key}: ${String(value)}px;`);
    }
  });

  it("resets every Tailwind default before adding the tokens", () => {
    expect(blockOf(css, "@theme inline")).toMatch(
      /^@theme inline \{\n {2}--\*: initial;/,
    );
  });

  it("puts T1 light on :root, dark under prefers-color-scheme, and dark in the ink scope", () => {
    const lightStart = css.indexOf(":root {\n  color-scheme");
    const light = css.slice(lightStart, css.indexOf("\n}", lightStart));
    const dark = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));
    const ink = blockOf(css, '[data-ground="ink"]');
    for (const pair of pairs) {
      expect(light).toContain(`${pair.token}: ${pair.light};`);
      expect(blockOf(dark, ":root")).toContain(`${pair.token}: ${pair.dark};`);
      expect(ink).toContain(`${pair.token}: ${pair.dark};`);
      expect(css).toContain(
        `--color-${pair.token.slice(2)}: var(${pair.token});`,
      );
    }
  });

  it("keeps text on an accent T1's light ink in both themes", () => {
    const ink = pairs.find((pair) => pair.token === "--ink");
    expect(css).toContain(`--on-accent: ${String(ink?.light)};`);
    expect(css.match(/--on-accent:/g)?.length).toBe(1);
  });

  it("has the marketing hero as one fluid step, Round 31", () => {
    expect(blockOf(css, "@utility type-hero")).toContain(
      "font-size: clamp(44px, calc(28px + 4.05vw), 76px);",
    );
  });

  it("drifts loudly when a token changes", () => {
    const changed = {
      ...tokens,
      TYPE: { ...tokens.TYPE, body: { ...tokens.TYPE.body, size: 14 } },
    } as Tokens;
    expect(deriveThemeCss(changed, pairs)).not.toBe(css);
  });
});

describe("parseT1", () => {
  it("reads every row of the Theme board's table", () => {
    const rows = parseT1(readFileSync(T1_SOURCE, "utf8"));
    expect(rows.length).toBe(20);
    expect(rows[0]).toEqual({
      role: "Ground",
      token: "--ground",
      light: "#F4F3EF",
      dark: "#0B0B0E",
    });
    for (const row of rows) {
      expect(row.light).toMatch(/^#[0-9A-F]{6}$/);
      expect(row.dark).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  const wrap = (rows: string) => `const pairs = [\n${rows}\n].map(() => 1)`;

  it("reads a note with an escaped quote", () => {
    const rows = parseT1(
      wrap(
        `['Muted', '--muted', '#7a7a70', '#8B8B93', 'Never a control\\'s label.']`,
      ),
    );
    expect(rows).toEqual([
      { role: "Muted", token: "--muted", light: "#7A7A70", dark: "#8B8B93" },
    ]);
  });

  it("fails on a malformed row instead of dropping it", () => {
    expect(() =>
      parseT1(
        wrap(
          `['Ground', '--ground', '#F4F3EF', '#0B0B0E', 'ok'],\n['Ink', '--ink', 'black', '#F4F3EF', 'bad']`,
        ),
      ),
    ).toThrow(/read 1 of 2 rows/);
  });

  it("fails on a repeated token", () => {
    expect(() =>
      parseT1(
        wrap(
          `['Ground', '--ground', '#F4F3EF', '#0B0B0E', 'a'],\n['Ground', '--ground', '#F4F3EF', '#0B0B0E', 'b']`,
        ),
      ),
    ).toThrow(/appears twice/);
  });

  it("fails when the table isn't there", () => {
    expect(() => parseT1("<html></html>")).toThrow(/no `const pairs/);
  });
});
