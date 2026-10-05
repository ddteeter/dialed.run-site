import { describe, expect, it } from "vitest";
import { captionRule, holdFor } from "../tests/e2e/support/caption";

describe("demo captions", () => {
  it("hold for reading time, between a floor and a ceiling", () => {
    expect(holdFor("Short")).toBe(1400);
    expect(holdFor("one two three four five six seven eight nine ten")).toBe(
      2600,
    );
    expect(holdFor(Array.from({ length: 40 }, () => "word").join(" "))).toBe(
      4200,
    );
  });

  it("paint through html::after, so the text never enters the document", () => {
    const rule = captionRule('Say "hi"');
    expect(rule).toMatch(/^html::after \{/u);
    expect(rule).toContain('content: "Say \\"hi\\"";');
  });
});
