import { describe, expect, it } from "vitest";
import { cssFiles, htmlPages, readDist } from "./helpers";

describe("built fonts", () => {
  const css = cssFiles()
    .map((file) => readDist(`_astro/${file}`))
    .join("\n");

  it.each(htmlPages())("%s preloads the two faces the CSS asks for", (page) => {
    const html = readDist(page);
    const preloads = [
      ...html.matchAll(/<link rel="preload" href="([^"]+)" as="font"/g),
    ].map((m) => m[1]);
    expect(preloads).toHaveLength(2);
    for (const href of preloads) expect(css).toContain(`url(${String(href)})`);
  });

  it("loads no font from a third-party host", () => {
    expect(css).not.toMatch(/url\(https?:/);
  });
});
