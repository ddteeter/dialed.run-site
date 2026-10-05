import { describe, expect, it } from "vitest";
import { APP_PATHS, redirectsFile } from "@/lib/redirects";

describe("redirectsFile", () => {
  const file = redirectsFile("https://app.dialed.run");

  it("moves every app path, and everything under it, to the app with a 301", () => {
    for (const path of APP_PATHS) {
      expect(file).toContain(`${path} https://app.dialed.run${path} 301\n`);
      expect(file).toContain(
        `${path}/* https://app.dialed.run${path}/:splat 301\n`,
      );
    }
  });

  it("covers round 31's list exactly", () => {
    expect(APP_PATHS).toEqual([
      "/feed",
      "/login",
      "/join",
      "/account",
      "/reset",
      "/confirm",
    ]);
  });

  it("follows APP_ORIGIN", () => {
    expect(redirectsFile("https://staging.example")).toContain(
      "/join https://staging.example/join 301",
    );
  });
});
