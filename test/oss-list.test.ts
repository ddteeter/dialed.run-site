import { describe, expect, it } from "vitest";
import {
  bundledFrom,
  openSourceList,
  toolsFrom,
  typePieces,
  type InstalledNode,
  type PackageFiles,
} from "@/lib/oss/list";
import { FONT_FAMILIES } from "@/theme/fonts";

/** The joins behind /open-source (src/lib/oss/list.ts). */
const node = (
  name: string,
  version: string,
  more: Partial<InstalledNode> = {},
): InstalledNode => ({
  name,
  version,
  location: `node_modules/${name}`,
  path: `/x/node_modules/${name}`,
  ...more,
});

const NO_FILES: PackageFiles = {
  licence: () => undefined,
  notice: () => undefined,
};

const TAILWIND_CSS =
  "/*! tailwindcss v4.3.3 | MIT License | https://tailwindcss.com */\n.a{}";

describe("bundledFrom", () => {
  it("joins a report entry to its installed copy, keeping the report's licence and text", () => {
    const [entry] = bundledFrom(
      [{ name: "a", version: "1.0.0", identifier: "ISC", text: "Words" }],
      [],
      [
        node("a", "2.0.0", { license: "MIT" }),
        node("a", "1.0.0", {
          license: "MIT",
          author: "A Person",
          homepage: "https://a.dev",
          repository: "a/a",
        }),
      ],
      { licence: () => "file words", notice: (dir) => `notice in ${dir}` },
    );
    expect(entry).toStrictEqual({
      name: "a",
      version: "1.0.0",
      identifier: "ISC",
      text: "Words",
      author: "A Person",
      homepage: "https://a.dev",
      repository: "a/a",
      notice: "notice in /x/node_modules/a",
    });
  });

  it("reads a banner's licence from package.json and its text from the package's file", () => {
    const seen: string[] = [];
    const [entry] = bundledFrom(
      [],
      [TAILWIND_CSS],
      [node("tailwindcss", "4.3.3", { license: "MIT" })],
      {
        licence: (dir) => {
          seen.push(dir);
          return "  MIT words \n";
        },
        notice: () => undefined,
      },
    );
    expect(seen).toEqual(["/x/node_modules/tailwindcss"]);
    expect(entry).toMatchObject({
      name: "tailwindcss",
      version: "4.3.3",
      identifier: "MIT",
      text: "MIT words",
    });
  });

  it("leaves the licence unknown when package.json's isn't text", () => {
    const [entry] = bundledFrom(
      [{ name: "a", version: "1" }],
      [],
      [node("a", "1", { license: { type: "MIT" } })],
      NO_FILES,
    );
    expect(entry?.identifier).toBeUndefined();
    expect(entry?.text).toBeUndefined();
  });

  it("fails for a shipped package that isn't installed at that version", () => {
    expect(() =>
      bundledFrom(
        [{ name: "a", version: "1" }],
        [],
        [node("a", "2")],
        NO_FILES,
      ),
    ).toThrow("a@1 is shipped but not installed");
  });
});

describe("toolsFrom", () => {
  it("credits each direct dependency that doesn't ship, at its top-level copy", () => {
    const tools = toolsFrom(
      [
        node("vitest", "5.0.0", { license: "MIT" }),
        node("vitest", "4.0.0", {
          license: "MIT",
          location: "node_modules/x/node_modules/vitest",
        }),
        node("tailwindcss", "4.3.3", { license: "MIT" }),
        node("transitive", "1.0.0", { license: "MIT" }),
        { location: "", path: "/x" },
      ],
      new Set(["vitest", "tailwindcss"]),
      new Set(["tailwindcss"]),
    );
    expect(tools).toStrictEqual([
      { name: "vitest", version: "5.0.0", licence: "MIT" },
    ]);
  });
});

describe("typePieces", () => {
  it("names each family as its tokens.js stack does", () => {
    expect(
      typePieces(FONT_FAMILIES, {
        display: "'Archivo Black', sans-serif",
        text: "Archivo, sans-serif",
        mono: "'IBM Plex Mono', monospace",
      }).map((piece) => [piece.name, piece.licence, piece.copyright]),
    ).toEqual([
      ["Archivo", "OFL-1.1", "2020 The Archivo Project Authors"],
      ["Archivo Black", "OFL-1.1", "2017 The Archivo Black Project Authors"],
      [
        "IBM Plex Mono",
        "OFL-1.1",
        '2017 IBM Corp. with Reserved Font Name "Plex"',
      ],
    ]);
  });
});

describe("openSourceList", () => {
  const MIT_TEXT = `Copyright (c) Tailwind Labs, Inc.\n\nPermission is hereby granted.`;
  const sources = {
    report: [],
    stylesheets: [TAILWIND_CSS],
    nodes: [
      node("tailwindcss", "4.3.3", { license: "MIT" }),
      node("astro", "7.0.0", { license: "MIT" }),
    ],
    direct: new Set(["tailwindcss", "astro"]),
    files: { licence: () => MIT_TEXT, notice: () => undefined },
    type: [{ name: "Archivo", licence: "OFL-1.1" }],
    typeLicence: "OFL words",
  };

  it("lists what ships, the tools, the type and each licence's text", () => {
    expect(openSourceList(sources)).toStrictEqual({
      type: [{ name: "Archivo", licence: "OFL-1.1" }],
      packages: [
        {
          name: "tailwindcss",
          version: "4.3.3",
          licence: "MIT",
          copyright: "Tailwind Labs, Inc",
        },
      ],
      tools: [{ name: "astro", version: "7.0.0", licence: "MIT" }],
      licences: {
        MIT: "Permission is hereby granted.",
        "OFL-1.1": "OFL words",
      },
    });
  });

  it("fails the build for a shipped licence this site doesn't recognise", () => {
    expect(() =>
      openSourceList({
        ...sources,
        nodes: [node("tailwindcss", "4.3.3", { license: "Custom" })],
      }),
    ).toThrow("tailwindcss@4.3.3: Custom");
  });
});
