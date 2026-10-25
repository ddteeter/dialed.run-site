/**
 * The licences this site accepts for what it ships (HANDOFF §7). Every
 * shipped package needs one of them, or the build fails: src/lib/oss/list.ts
 * runs `checkLicences` over the shipped set at postbuild.
 */

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
export function checkLicences(
  packages: readonly {
    readonly name: string;
    readonly version?: string | undefined;
    readonly licence: string | undefined;
  }[],
): void {
  const bad = packages.filter((pkg) => !isRecognised(pkg.licence));
  if (bad.length > 0) {
    throw new Error(
      `Packages with a missing or unrecognised licence:\n${bad
        .map(
          (pkg) =>
            `  ${pkg.name}@${pkg.version ?? "?"}: ${pkg.licence ?? "none"}`,
        )
        .join("\n")}`,
    );
  }
}
