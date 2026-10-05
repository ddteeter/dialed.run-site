import { describe, expect, it } from "vitest";
import config from "../astro.config.mjs";
import { SITE_ORIGIN, absolute, appUrl, paths } from "@/config/urls";

describe("urls", () => {
  it("keeps astro.config site and SITE_ORIGIN in step", () => {
    expect(config.site).toBe(SITE_ORIGIN);
  });

  it("builds apex URLs with no trailing slash", () => {
    expect(absolute(paths.home)).toBe("https://dialed.run");
    expect(absolute(paths.howItWorks)).toBe("https://dialed.run/how-it-works");
  });

  it("writes every internal path without a trailing slash or .html", () => {
    for (const path of Object.values(paths)) {
      expect(path).toMatch(/^\/([a-z0-9-]+(\/[a-z0-9-]+)*(\.xml)?)?$/);
    }
  });

  it("builds absolute app URLs", () => {
    expect(appUrl("/join", "https://app.dialed.run")).toBe(
      "https://app.dialed.run/join",
    );
  });
});
