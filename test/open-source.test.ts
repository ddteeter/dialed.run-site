import { describe, expect, it } from "vitest";
import {
  checkLicences,
  fromQuery,
  installedProductionPackages,
  isRecognised,
  repositoryUrl,
} from "@/lib/oss/licences";

describe("isRecognised", () => {
  it.each(["MIT", "(MIT OR Apache-2.0)", "BSD-3-Clause AND MIT", "OFL-1.1"])(
    "accepts %s",
    (id) => {
      expect(isRecognised(id)).toBe(true);
    },
  );

  it.each([
    undefined,
    "",
    "UNLICENSED",
    "SEE LICENSE IN LICENSE.md",
    "(MIT OR Custom)",
  ])("refuses %j", (id) => {
    expect(isRecognised(id)).toBe(false);
  });
});

describe("checkLicences", () => {
  it("names every package with a missing or unrecognised licence", () => {
    expect(() => {
      checkLicences([
        { name: "fine", version: "1.0.0", licence: "MIT", homepage: undefined },
        {
          name: "none",
          version: "1.0.0",
          licence: undefined,
          homepage: undefined,
        },
        {
          name: "odd",
          version: "2.0.0",
          licence: "Custom",
          homepage: undefined,
        },
      ]);
    }).toThrow(/none@1\.0\.0: none\n {2}odd@2\.0\.0: Custom/);
  });
});

describe("fromQuery", () => {
  it("drops the root, de-duplicates, and reads every licence shape", () => {
    const packages = fromQuery([
      { name: "dialed-run-site", version: "0.0.0", location: "" },
      {
        name: "b",
        version: "1.0.0",
        location: "node_modules/b",
        license: "MIT",
      },
      {
        name: "b",
        version: "1.0.0",
        location: "node_modules/x/node_modules/b",
        license: "MIT",
      },
      {
        name: "a",
        version: "2.0.0",
        location: "node_modules/a",
        license: { type: "ISC" },
        repository: { type: "git", url: "git+https://github.com/x/a.git" },
      },
      {
        name: "c",
        version: "3.0.0",
        location: "node_modules/c",
        licenses: [{ type: "MIT" }, { type: "Apache-2.0" }],
      },
    ]);
    expect(packages).toEqual([
      {
        name: "a",
        version: "2.0.0",
        licence: "ISC",
        homepage: "https://github.com/x/a",
      },
      { name: "b", version: "1.0.0", licence: "MIT", homepage: undefined },
      {
        name: "c",
        version: "3.0.0",
        licence: "MIT OR Apache-2.0",
        homepage: undefined,
      },
    ]);
  });
});

describe("repositoryUrl", () => {
  it.each([
    [
      "syntax-tree/mdast-util-from-markdown",
      "https://github.com/syntax-tree/mdast-util-from-markdown",
    ],
    ["github:colinhacks/zod", "https://github.com/colinhacks/zod"],
    [
      { type: "git", url: "git+https://github.com/withastro/astro.git" },
      "https://github.com/withastro/astro",
    ],
    ["git://github.com/x/y.git", "https://github.com/x/y"],
    ["gitlab:x/y", undefined],
    ["file:../local", undefined],
    [undefined, undefined],
  ])("%j is %j", (repository, url) => {
    expect(repositoryUrl(repository)).toBe(url);
  });
});

describe("the installed production tree", () => {
  it("has a recognised licence on every package this site ships", () => {
    const packages = installedProductionPackages();
    expect(packages.length).toBeGreaterThan(0);
    expect(() => {
      checkLicences(packages);
    }).not.toThrow();
  });
});
