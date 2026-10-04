/**
 * The open-source packages this site ships (HANDOFF §7): generated from the
 * installed production tree, never hand-written. Every production package,
 * direct or transitive, needs a licence this site recognises, or the build
 * fails.
 */
import { execFileSync } from "node:child_process";

/** SPDX identifiers this site accepts. Add one only after reading it. */
export const RECOGNISED_LICENCES = new Set([
  "MIT",
  "ISC",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "CC0-1.0",
  "CC-BY-4.0",
  "BlueOak-1.0.0",
  "MPL-2.0",
  "Python-2.0",
  "LGPL-3.0-or-later",
  "OFL-1.1",
  "Unlicense",
]);

export interface InstalledPackage {
  name: string;
  version: string;
  licence: string | undefined;
  homepage: string | undefined;
}

/**
 * Whether an SPDX expression is acceptable: every identifier in it must be
 * recognised, so "(MIT OR Apache-2.0)" passes and "(MIT OR Custom)" doesn't.
 */
export function isRecognised(expression: string | undefined): boolean {
  if (expression === undefined || expression.trim() === "") return false;
  const ids = expression
    .replaceAll(/[()]/g, " ")
    .split(/\s+(?:OR|AND)\s+|\s+/)
    .filter((id) => id !== "");
  return ids.length > 0 && ids.every((id) => RECOGNISED_LICENCES.has(id));
}

/** Throws, naming every package whose licence is missing or unrecognised. */
export function checkLicences(packages: readonly InstalledPackage[]): void {
  const bad = packages.filter((pkg) => !isRecognised(pkg.licence));
  if (bad.length > 0) {
    throw new Error(
      `Packages with a missing or unrecognised licence:\n${bad
        .map((pkg) => `  ${pkg.name}@${pkg.version}: ${pkg.licence ?? "none"}`)
        .join("\n")}`,
    );
  }
}

interface QueryNode {
  name?: string;
  version?: string;
  location?: string;
  license?: unknown;
  licenses?: unknown;
  homepage?: unknown;
  repository?: unknown;
}

function repositoryUrl(repository: unknown): string | undefined {
  const url =
    typeof repository === "string"
      ? repository
      : typeof repository === "object" &&
          repository !== null &&
          "url" in repository
        ? String(repository.url)
        : undefined;
  return url
    ?.replace(/^git\+/, "")
    .replace(/^git:\/\//, "https://")
    .replace(/\.git$/, "");
}

function licenceOf(node: QueryNode): string | undefined {
  if (typeof node.license === "string") return node.license;
  if (
    typeof node.license === "object" &&
    node.license !== null &&
    "type" in node.license
  ) {
    return String(node.license.type);
  }
  if (Array.isArray(node.licenses)) {
    return node.licenses
      .map((l: unknown) =>
        typeof l === "object" && l !== null && "type" in l
          ? String(l.type)
          : String(l),
      )
      .join(" OR ");
  }
  return undefined;
}

/** `npm query .prod` output, minus the root package, one entry per name@version. */
export function fromQuery(nodes: readonly QueryNode[]): InstalledPackage[] {
  const seen = new Map<string, InstalledPackage>();
  for (const node of nodes) {
    if (
      node.location === "" ||
      node.name === undefined ||
      node.version === undefined
    )
      continue;
    const key = `${node.name}@${node.version}`;
    if (seen.has(key)) continue;
    seen.set(key, {
      name: node.name,
      version: node.version,
      licence: licenceOf(node),
      homepage:
        (typeof node.homepage === "string" ? node.homepage : undefined) ??
        repositoryUrl(node.repository),
    });
  }
  return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** The installed production tree, direct and transitive. */
export function installedProductionPackages(): InstalledPackage[] {
  const output = execFileSync("npm", ["query", ".prod"], {
    encoding: "utf8",
    maxBuffer: 64e6,
  });
  return fromQuery(JSON.parse(output) as QueryNode[]);
}
