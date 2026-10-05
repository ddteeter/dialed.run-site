import { describe, expect, it } from "vitest";
import {
  findUses,
  parsePin,
  workflowPins,
} from "../.github/scripts/verify-action-pins.mjs";

describe("action pins", () => {
  it("every workflow step pins a full SHA with its tag", () => {
    const pins = workflowPins();
    expect(pins.length).toBeGreaterThan(0);
    expect(
      pins
        .filter((p) => "error" in p.pin)
        .map((p) => `${p.file}:${String(p.line)}`),
    ).toEqual([]);
  });

  it("reads uses: lines, list item or not", () => {
    expect(
      findUses("steps:\n  - uses: a/b@x\n    with:\n  uses: c/d@y\n"),
    ).toEqual([
      { line: 2, value: "a/b@x" },
      { line: 4, value: "c/d@y" },
    ]);
  });

  it.each([
    "actions/checkout@v7",
    "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
    "actions/checkout@3d3c42e # v7.0.1",
    "actions/checkout@main",
  ])("refuses %s", (value) => {
    expect(parsePin(value)).toHaveProperty("error");
  });

  it("accepts a SHA with its tag, including an action in a subdirectory", () => {
    expect(
      parsePin(
        "actions/cache/restore@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0",
      ),
    ).toEqual({
      repo: "actions/cache",
      sha: "55cc8345863c7cc4c66a329aec7e433d2d1c52a9",
      tag: "v6.1.0",
    });
  });
});
