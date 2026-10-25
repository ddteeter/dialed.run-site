/**
 * The joins behind /open-source (app design 151, mirrored): what ships,
 * matched to what npm says of each package, and the direct dependencies
 * that don't ship.
 *
 * - **Ships** is Vite's licence report for the client build (the
 *   prerender build never reaches a visitor) plus each package a
 *   stylesheet's preserved banner names, which is how Tailwind's base
 *   styles are found. Each gets full text and copyright lines.
 * - **Tools we build with** is every direct dependency or devDependency
 *   that doesn't ship, by name, version, licence and project.
 * - **Type** is the site's own font list (src/theme/fonts.ts).
 *
 * Reads no file: scripts/open-source-list.ts hands it what it read, so a
 * test can give it anything. The text work is ./licence-text.ts, ported
 * from the app.
 */
import normalize from "normalize-package-data";
import { z } from "zod";
import {
  familyName,
  type FamilyKey,
  type FontFamilyCredit,
} from "../../theme/fonts.ts";
import { checkLicences } from "./licences.ts";
import {
  cssBanners,
  shippedList,
  toolList,
  type Bundled,
  type ListedPiece,
} from "./licence-text.ts";

/** Vite's `build.license` report, written as JSON. */
export const reportSchema = z.array(
  z.object({
    name: z.string(),
    version: z.string(),
    identifier: z.string().optional(),
    text: z.string().optional(),
  }),
);
export type ReportEntry = z.infer<typeof reportSchema>[number];

/**
 * What this reads of each installed package, once npm's own
 * `normalize-package-data` has read its package.json: the author cut to a
 * name, and a homepage, derived from the repository where the package is
 * on a known git host. Parsed after normalising, not trusted.
 */
const personSchema = z.object({ name: z.string().optional() });
const nodeSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  location: z.string(),
  path: z.string(),
  license: z.unknown().optional(),
  // An empty author ("") is left as it is.
  author: z.union([personSchema, z.literal("")]).optional(),
  homepage: z.string().optional(),
});
export type InstalledNode = z.infer<typeof nodeSchema>;

/** `npm query '*'`'s output, each package.json normalised as npm reads it. */
export function installedNodes(json: unknown): InstalledNode[] {
  return z
    .array(z.record(z.string(), z.unknown()))
    .parse(json)
    .map((manifest) => {
      normalize(manifest);
      return nodeSchema.parse(manifest);
    });
}

/** A package's own files, read from its installed directory. */
export interface PackageFiles {
  licence: (dir: string) => string | undefined;
  notice: (dir: string) => string | undefined;
}

/**
 * Every shipped package, joined to its installed copy on `name@version`.
 * A banner gives only a name and version, so its licence id comes from
 * package.json and its text from the package's licence file.
 */
export function bundledFrom(
  report: readonly ReportEntry[],
  stylesheets: readonly string[],
  nodes: readonly InstalledNode[],
  files: PackageFiles,
): Bundled[] {
  const byKey = new Map(
    nodes.map((node) => [`${String(node.name)}@${String(node.version)}`, node]),
  );
  const styled = stylesheets.flatMap((css) => cssBanners(css));
  return [...report, ...styled].map((entry: ReportEntry) => {
    const node = byKey.get(`${entry.name}@${entry.version}`);
    if (node === undefined) {
      throw new Error(
        `${entry.name}@${entry.version} is shipped but not installed`,
      );
    }
    return {
      ...entry,
      identifier:
        entry.identifier ??
        (typeof node.license === "string" ? node.license : undefined),
      text: entry.text ?? files.licence(node.path)?.trim(),
      author: node.author === "" ? undefined : node.author?.name,
      homepage: node.homepage,
      notice: files.notice(node.path),
    };
  });
}

/** Every direct dependency that doesn't ship, as installed at the top level. */
export function toolsFrom(
  nodes: readonly InstalledNode[],
  direct: ReadonlySet<string>,
  shipped: ReadonlySet<string>,
): readonly ListedPiece[] {
  return toolList(
    nodes.flatMap(({ name, version, ...node }) =>
      name !== undefined &&
      version !== undefined &&
      direct.has(name) &&
      !shipped.has(name) &&
      node.location === `node_modules/${name}`
        ? [{ ...node, name, version }]
        : [],
    ),
  );
}

/** The typefaces, named as tokens.js's stacks name them. */
export function typePieces(
  fonts: readonly FontFamilyCredit[],
  family: Readonly<Record<FamilyKey, string>>,
): readonly ListedPiece[] {
  return fonts.map((font) => ({
    name: familyName(family[font.family]),
    licence: font.licence,
    copyright: font.copyright,
    project: font.source,
  }));
}

export interface ListSources {
  report: readonly ReportEntry[];
  stylesheets: readonly string[];
  nodes: readonly InstalledNode[];
  /** Every name in package.json's dependencies and devDependencies. */
  direct: ReadonlySet<string>;
  files: PackageFiles;
  type: readonly ListedPiece[];
  /** The OFL's text, which every typeface ships under. */
  typeLicence: string;
}

/**
 * The list the page renders. Throws, failing the build, when a shipped
 * package's licence is missing or one this site doesn't recognise
 * (HANDOFF §7).
 */
export function openSourceList(sources: ListSources) {
  const { packages, licences } = shippedList(
    bundledFrom(
      sources.report,
      sources.stylesheets,
      sources.nodes,
      sources.files,
    ),
  );
  checkLicences(packages);
  return {
    type: sources.type,
    packages,
    tools: toolsFrom(
      sources.nodes,
      sources.direct,
      new Set(packages.map((piece) => piece.name)),
    ),
    licences: { ...licences, "OFL-1.1": sources.typeLicence },
  };
}
