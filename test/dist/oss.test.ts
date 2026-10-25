import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DIST } from "./helpers";

describe("Vite's licence report", () => {
  it("is moved out of dist/, so it's never published", () => {
    expect(existsSync(join(DIST, "oss-license.json"))).toBe(false);
  });
});
