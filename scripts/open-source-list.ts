/**
 * Writes src/lib/oss/open-source-list.json for /open-source, mirroring the
 * app's scripts/open-source-list.ts (design 151). Plumbing only: it reads
 * Vite's licence report (moved to .oss/ by src/integrations/oss-report.ts),
 * the built stylesheets' banners, `npm query '*'` (read through npm's
 * `normalize-package-data`), package.json and the fonts, and hands them to src/lib/oss/list.ts.
 *
 * **Run by `postbuild`**, because the report exists only after a build.
 * The list stays committed, so tests and dev read it without building.
 * Under `CI`, a list that a build changes fails: a dependency changed and
 * nobody ran `npm run build` and committed the list. The list is JSON read
 * at prerender, so it can't change what ships: one build is a fixed point.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { OSS_REPORT } from "../src/integrations/oss-report.ts";
import {
  installedNodes,
  openSourceList,
  reportSchema,
  typePieces,
  type InstalledNode,
} from "../src/lib/oss/list.ts";
import { FONT_FAMILIES } from "../src/theme/fonts.ts";
import { readThemeSources } from "../src/theme/sources.ts";

const OUT = path.join("src", "lib", "oss", "open-source-list.json");
const STYLES = path.join("dist", "_astro");
const TYPE_LICENCE = path.join("src", "theme", "OFL-1.1.txt");

const manifestSchema = z.object({
  dependencies: z.record(z.string(), z.string()).default({}),
  devDependencies: z.record(z.string(), z.string()).default({}),
});

/**
 * npm's own tree, asked of the npm that is running this script
 * (`npm run build` sets `npm_execpath`), not of whichever `npm` is first
 * on the PATH.
 */
function installed(): InstalledNode[] {
  const npm = process.env.npm_execpath;
  if (npm === undefined) {
    throw new Error("run this through npm: `npm run build`");
  }
  const out = execFileSync(process.execPath, [npm, "query", "*"], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  return installedNodes(JSON.parse(out));
}

/** The first file in `dir` whose name matches, as text. */
function fileIn(dir: string, pattern: RegExp): string | undefined {
  const name = readdirSync(dir).find((entry) => pattern.test(entry));
  return name === undefined
    ? undefined
    : readFileSync(path.join(dir, name), "utf8").replaceAll("\r\n", "\n");
}

const NOTICE = /^notice(?:\.(?:md|txt))?$/iu;
const LICENCE_FILE = /^(?:licen[cs]e|copying)(?:[.-].*)?$/iu;

const reportPath = fileURLToPath(OSS_REPORT);
if (!existsSync(reportPath)) {
  throw new Error(`${reportPath} is missing: run this after \`astro build\``);
}
const manifest = manifestSchema.parse(
  JSON.parse(readFileSync("package.json", "utf8")),
);
const { tokens } = await readThemeSources();
const family = {
  display: tokens.FAMILY.display ?? "",
  text: tokens.FAMILY.text ?? "",
  mono: tokens.FAMILY.mono ?? "",
};

const list = openSourceList({
  report: reportSchema.parse(JSON.parse(readFileSync(reportPath, "utf8"))),
  stylesheets: readdirSync(STYLES)
    .filter((file) => file.endsWith(".css"))
    .map((file) => readFileSync(path.join(STYLES, file), "utf8")),
  nodes: installed(),
  direct: new Set([
    ...Object.keys(manifest.dependencies),
    ...Object.keys(manifest.devDependencies),
  ]),
  files: {
    licence: (dir) => fileIn(dir, LICENCE_FILE),
    notice: (dir) => fileIn(dir, NOTICE),
  },
  type: typePieces(FONT_FAMILIES, family),
  typeLicence: readFileSync(TYPE_LICENCE, "utf8").trim(),
});
const written = `${JSON.stringify(list, undefined, 2)}\n`;
const before = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
writeFileSync(OUT, written);
console.log(
  `open-source list: ${String(list.packages.length)} packages shipped, ${String(list.tools.length)} tools, ${String(list.type.length)} type families`,
);
if (written !== before && process.env.CI !== undefined) {
  throw new Error(
    `${OUT} was out of date: a dependency changed. Run \`npm run build\` and commit the list.`,
  );
}
