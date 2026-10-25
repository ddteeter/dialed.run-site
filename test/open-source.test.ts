import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import OpenSourcePage from "@/components/oss/OpenSourcePage.astro";
import {
  licenceGroups,
  openSourceList,
  readLabel,
  toolsGroup,
} from "@/lib/oss/groups";
import { checkLicences, isRecognised } from "@/lib/oss/licences";
import { parse, render } from "./render";

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
        { name: "fine", version: "1.0.0", licence: "MIT" },
        { name: "none", version: "1.0.0", licence: undefined },
        { name: "odd", version: "2.0.0", licence: "Custom" },
      ]);
    }).toThrow(/none@1\.0\.0: none\n {2}odd@2\.0\.0: Custom/);
  });
});

describe("the committed list", () => {
  const list = openSourceList();

  it("has a recognised licence on everything this site ships", () => {
    expect(() => {
      checkLicences([...list.type, ...list.packages]);
    }).not.toThrow();
  });

  it("ships tailwindcss, from its stylesheet banner, with its MIT text and holder", () => {
    expect(list.packages).toContainEqual(
      expect.objectContaining({
        name: "tailwindcss",
        licence: "MIT",
        copyright: expect.stringContaining("Tailwind Labs") as unknown,
      }),
    );
    expect(list.licences.MIT).toMatch(/^Permission is hereby granted/);
  });

  it("credits every direct dependency in exactly one tier, shipped first", () => {
    const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const shipped = list.packages.map((piece) => piece.name);
    const tools = list.tools.map((piece) => piece.name);
    expect(shipped.filter((name) => tools.includes(name))).toEqual([]);
    const credited = new Set([...shipped, ...tools]);
    expect(
      [
        ...Object.keys(manifest.dependencies),
        ...Object.keys(manifest.devDependencies),
      ].filter((name) => !credited.has(name)),
    ).toEqual([]);
  });

  it("gives every licence group its text", () => {
    for (const group of licenceGroups(list)) {
      expect(group.text, group.name).toBeDefined();
    }
  });
});

describe("readLabel", () => {
  it("names the licence, unless its name already says licence", () => {
    const [type, mit] = licenceGroups(openSourceList());
    expect(type && readLabel(type)).toBe("Read the licence text");
    expect(mit && readLabel(mit)).toBe("Read the MIT licence");
  });
});

describe("/open-source", async () => {
  const list = openSourceList({
    type: [
      {
        name: "Archivo",
        licence: "OFL-1.1",
        copyright: "2020 The Archivo Project Authors",
        project: "https://github.com/Omnibus-Type/Archivo",
      },
    ],
    packages: [
      {
        name: "tailwindcss",
        version: "4.3.3",
        licence: "MIT",
        copyright: "Tailwind Labs, Inc",
        project: "https://tailwindcss.com",
      },
      {
        name: "photon",
        version: "0.4.0",
        licence: "Apache-2.0",
        notice: "This product includes…",
        text: "Apache words, amended",
      },
      { name: "plain", version: "1.0.0", licence: "MIT" },
    ],
    tools: [
      {
        name: "astro",
        version: "7.3.5",
        licence: "MIT",
        project: "https://astro.build",
      },
    ],
    licences: {
      MIT: "MIT words",
      "Apache-2.0": "Apache words",
      "OFL-1.1": "OFL words",
    },
  });
  const doc = parse(
    await render(
      OpenSourcePage,
      { groups: licenceGroups(list), tools: toolsGroup(list) },
      { url: "https://dialed.run/open-source" },
    ),
  );
  const section = (id: string) => doc.getElementById(id)?.closest("section");

  it("puts the type first, the licences largest first, then the tools last", () => {
    expect(
      [...doc.querySelectorAll("#contents a")].map((a) =>
        a.getAttribute("href"),
      ),
    ).toEqual([
      "#sil-open-font-license-11",
      "#mit",
      "#apache-20",
      "#tools-we-build-with",
    ]);
    expect(
      [...doc.querySelectorAll("h2[id]")].map((h) => h.id).slice(1),
    ).toEqual([
      "sil-open-font-license-11",
      "mit",
      "apache-20",
      "tools-we-build-with",
    ]);
  });

  it("counts each group in the contents (round 40 #83f)", () => {
    expect(
      [...doc.querySelectorAll("#contents li")].map((li) => [
        li.querySelector("a")?.textContent.trim(),
        li.querySelector(".mono-sm")?.textContent,
      ]),
    ).toEqual([
      ["SIL Open Font License 1.1", "1"],
      ["MIT", "2"],
      ["Apache 2.0", "1"],
      ["Tools we build with", "1"],
    ]);
  });

  it("counts only what ships in the lead", () => {
    expect(doc.querySelector(".type-lead")?.textContent).toContain(
      "all 4 pieces it ships",
    );
  });

  it("prints each group's count, and its licence text once", () => {
    expect(section("sil-open-font-license-11")?.textContent).toContain(
      "1 · TYPE",
    );
    const mit = section("mit");
    expect(mit?.querySelector(".mono-sm")?.textContent).toBe("2");
    expect(mit?.querySelectorAll("details")).toHaveLength(1);
    expect(mit?.querySelector("summary")?.textContent).toBe(
      "Read the MIT licence",
    );
    expect(mit?.querySelector("pre")?.textContent).toBe("MIT words");
  });

  it("shows a row's version, project and copyright", () => {
    const row = section("mit")?.querySelector("li");
    expect(row?.textContent).toContain("tailwindcss");
    expect(row?.querySelector(".mono-sm")?.textContent).toBe("4.3.3");
    expect(row?.querySelector("a")?.getAttribute("href")).toBe(
      "https://tailwindcss.com",
    );
    expect(row?.textContent).toContain("© Tailwind Labs, Inc");
  });

  it("opens a NOTICE and a row's own licence text where it has them", () => {
    const summaries = [
      ...(section("apache-20")?.querySelectorAll("li summary") ?? []),
    ].map((s) => s.textContent);
    expect(summaries).toEqual(["Notice", "Licence"]);
  });

  it("says first that it covers the website, and links the app's own list", () => {
    const lead = doc.querySelector(".type-lead");
    expect(lead?.textContent).toMatch(
      /^\s*This page covers the dialed\.run website\. The app keeps its own list, at\s+app\.dialed\.run\/open-source\./,
    );
    expect(lead?.querySelector("a")?.getAttribute("href")).toBe(
      "https://app.dialed.run/open-source",
    );
    expect(doc.getElementById("the-app")).toBeNull();
  });

  it("credits a tool by licence in place of a copyright line, and says none ships", () => {
    const tools = section("tools-we-build-with");
    expect(tools?.querySelector(".mono-sm")?.textContent).toBe(
      "1 · NOT SHIPPED",
    );
    expect(tools?.querySelector(".text-quiet")?.textContent).toContain(
      "None of them ships in it",
    );
    const row = tools?.querySelector("li");
    expect(row?.querySelector(".mono-xs")?.textContent).toBe("MIT");
    expect(row?.textContent).not.toContain("©");
    expect(tools?.querySelector("details")).toBeNull();
  });
});
