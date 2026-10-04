import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { LINT } from "../design-reference/contracts/tokens.js";
import { contractRules, lintSource } from "@/theme/contract-lint";

const rules = contractRules(LINT);
const ids = (text: string, file = "x.astro") =>
  lintSource(file, text, rules).map((v) => v.rule);

describe("contract rules", () => {
  it("takes every RegExp rule tokens.js exports", () => {
    const fromTokens = LINT.filter(
      (entry) => entry.reject instanceof RegExp,
    ).map((entry) => entry.id);
    expect(fromTokens.length).toBeGreaterThan(0);
    for (const id of fromTokens) expect(rules.map((r) => r.id)).toContain(id);
  });

  it.each([
    ["font-size: 14px;", "no-raw-font-size"],
    ["letter-spacing: 0.08em;", "no-raw-tracking"],
    ["font-family: 'Archivo';", "no-raw-font-family"],
    ["border-radius: 8px;", "no-raw-radius"],
    ["padding: 20px;", "no-raw-spacing"],
    ["@media (min-width: 800px)", "no-raw-breakpoint"],
    ["max-width: 620px;", "no-raw-measure"],
    ["color: #2A2A26;", "no-raw-hex"],
    ['<div class="max-w-[620px]">', "no-tailwind-arbitrary-value"],
    ['<div class="bg-[#fff] p-4">', "no-tailwind-arbitrary-value"],
    ['<div class="[color:red]">', "no-tailwind-arbitrary-value"],
    ["<button disabled>", "no-disabled-attribute"],
  ])("rejects %j", (text, rule) => {
    expect(ids(text)).toContain(rule);
  });

  it.each([
    "font: var(--type-body);",
    "letter-spacing: var(--track-body);",
    "border-bottom: 1px solid var(--hairline);",
    "border-top: 2px solid var(--ink);",
    "outline-offset: 2px;",
    '<a href="#contents">',
    '<a href="#fed">',
    '<button aria-disabled="true">',
    '<div class="p-4 wide:p-6 max-w-column">',
    '<a href="/">[dialed]</a>',
    "<span>[38–52°]</span>",
    "const first = rows[0];",
  ])("allows %j", (text) => {
    expect(ids(text)).toEqual([]);
  });

  it("reports the line of each violation", () => {
    const [violation] = lintSource(
      "a.css",
      "a {}\nb { color: #fff; }\n",
      rules,
    );
    expect(violation).toMatchObject({
      file: "a.css",
      line: 2,
      rule: "no-raw-hex",
    });
  });
});

describe("src/", () => {
  const root = new URL("../src/", import.meta.url).pathname;
  const skip = [/^styles\/[a-z]+\.generated\.css$/, /^theme\//];

  const files = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return files(path);
      return /\.(astro|css|ts)$/.test(entry.name) ? [path] : [];
    });

  it("has no raw values outside the generated theme", () => {
    const violations = files(root)
      .filter(
        (path) => !skip.some((pattern) => pattern.test(relative(root, path))),
      )
      .flatMap((path) =>
        lintSource(relative(root, path), readFileSync(path, "utf8"), rules),
      );
    expect(violations).toEqual([]);
  });
});
