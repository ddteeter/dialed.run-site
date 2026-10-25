/**
 * /open-source's groups, mirroring the app's src/modules/account/
 * open-source.ts and open-source-search.ts (design 151; round 40 #82):
 * the committed list, parsed rather than trusted, grouped by licence with
 * the type first, and the tools that don't ship in a group of their own.
 */
import { z } from "zod";
import { headingId } from "../legal/markdown.ts";
import listJson from "./open-source-list.json";
import type { OpenSourcePiece } from "./piece.ts";

const pieceSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1).optional(),
  licence: z.string().min(1),
  copyright: z.string().min(1).optional(),
  project: z.string().startsWith("https://").optional(),
  notice: z.string().min(1).optional(),
  text: z.string().min(1).optional(),
});

const listSchema = z.object({
  type: z.array(pieceSchema),
  packages: z.array(pieceSchema),
  tools: z.array(pieceSchema),
  licences: z.record(z.string(), z.string()),
});

export type OpenSourceList = z.infer<typeof listSchema>;
type Piece = z.infer<typeof pieceSchema>;

/** The list as the build wrote it (scripts/open-source-list.ts). */
export function openSourceList(source: unknown = listJson): OpenSourceList {
  return listSchema.parse(source);
}

/** Every piece under one licence, or the tools. */
export interface LicenceGroup {
  /** The section's id, which the contents link to. */
  readonly id: string;
  /** The licence as the heading names it: "MIT", "Apache 2.0". */
  readonly name: string;
  /**
   * `type`: the typefaces, which come first. `licence`: the packages that
   * ship under one licence. `tools`: the tools that build the site and
   * don't ship in it, each row naming its licence.
   */
  readonly kind: "type" | "licence" | "tools";
  /** The licence's words, printed once for the group. */
  readonly text: string | undefined;
  readonly pieces: readonly OpenSourcePiece[];
}

/**
 * How a heading names a licence: the SPDX id, where it reads well, and
 * the app's words where it doesn't.
 */
const LICENCE_NAMES: Readonly<Record<string, string>> = {
  "Apache-2.0": "Apache 2.0",
  "CC-BY-4.0": "CC BY 4.0",
  "OFL-1.1": "SIL Open Font License 1.1",
};

function groupsOf(
  pieces: readonly Piece[],
  licences: Readonly<Record<string, string>>,
  kind: LicenceGroup["kind"],
): LicenceGroup[] {
  const byLicence = new Map<string, Piece[]>();
  for (const piece of pieces) {
    byLicence.set(piece.licence, [
      ...(byLicence.get(piece.licence) ?? []),
      piece,
    ]);
  }
  return [...byLicence].map(([licence, members]) => {
    const name = LICENCE_NAMES[licence] ?? licence;
    return {
      id: headingId(name),
      name,
      kind,
      text: licences[licence],
      pieces: members,
    };
  });
}

/**
 * The type first, then the packages' licences, largest first and by name
 * where two are the same size.
 */
export function licenceGroups(list: OpenSourceList): readonly LicenceGroup[] {
  const packages = groupsOf(list.packages, list.licences, "licence").toSorted(
    (a, b) => b.pieces.length - a.pieces.length || a.name.localeCompare(b.name),
  );
  return [...groupsOf(list.type, list.licences, "type"), ...packages];
}

/** "Tools we build with" (round 40 #82), under one heading, last. */
export function toolsGroup(list: OpenSourceList): LicenceGroup {
  return {
    id: "tools-we-build-with",
    name: "Tools we build with",
    kind: "tools",
    text: undefined,
    pieces: list.tools,
  };
}

/** How many pieces the groups hold between them: the lead's {N}. */
export function pieceCount(groups: readonly LicenceGroup[]): number {
  return groups.reduce((total, group) => total + group.pieces.length, 0);
}

/**
 * The control that opens a group's licence text: "Read the MIT licence",
 * or "Read the licence text" where the name already says licence.
 */
export function readLabel(group: LicenceGroup): string {
  return /licen[cs]e/iu.test(group.name)
    ? "Read the licence text"
    : `Read the ${group.name} licence`;
}
