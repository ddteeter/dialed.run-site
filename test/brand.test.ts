import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import Wordmark from "@/components/Wordmark.astro";
import { webManifest } from "@/lib/manifest";
import { T1_SOURCE } from "@/theme/sources";
import { parseT1 } from "@/theme/t1";
import { parse, render } from "./render";

const pairs = parseT1(readFileSync(T1_SOURCE, "utf8"));

/** A PNG's width and height, from its IHDR chunk. */
function pngSize(path: URL): [number, number] {
  const png = readFileSync(path);
  return [png.readUInt32BE(16), png.readUInt32BE(20)];
}

describe("wordmark", () => {
  it("reads [dialed.run], with action brackets and a muted .run", async () => {
    const doc = parse(await render(Wordmark));
    expect(doc.body.textContent.replaceAll(/\s/g, "")).toBe("[dialed.run]");
    const brackets = [...doc.querySelectorAll(".text-action")].map(
      (el) => el.textContent,
    );
    expect(brackets).toEqual(["[", "]"]);
    expect(doc.querySelector(".text-muted")?.textContent).toBe(".run");
  });
});

describe("web manifest", () => {
  const manifest = webManifest(pairs);
  const ground = pairs.find((pair) => pair.token === "--ground");

  it("takes its colours from T1's dark ground", () => {
    expect(manifest.theme_color).toBe(ground?.dark);
    expect(manifest.background_color).toBe(ground?.dark);
  });

  it("lists icons that exist at their stated sizes", () => {
    const icons = manifest.icons as { src: string; sizes: string }[];
    for (const icon of icons) {
      const [width, height] = pngSize(
        new URL(`../public${icon.src}`, import.meta.url),
      );
      expect(`${String(width)}x${String(height)}`).toBe(icon.sizes);
    }
  });
});

describe("brand assets", () => {
  it("ships the 1200×630 OG card", () => {
    expect(pngSize(new URL("../public/og.png", import.meta.url))).toEqual([
      1200, 630,
    ]);
  });

  it("ships the apple-touch icon at 180", () => {
    expect(
      pngSize(new URL("../public/apple-touch-icon.png", import.meta.url)),
    ).toEqual([180, 180]);
  });
});
