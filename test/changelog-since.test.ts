import { describe, expect, it } from "vitest";
import { mergedPrsCommand, newestEntryDate } from "@/lib/changelog/since";

describe("newestEntryDate", () => {
  it("is the newest dated entry file", () => {
    expect(
      newestEntryDate([
        "README.md",
        "2026-09-11-three-fixes.md",
        "2026-10-03-typed-city.md",
        "2026-09-24-start-time.md",
      ]),
    ).toBe("2026-10-03");
  });

  it("is undefined with no entries, so the caller has to choose", () => {
    expect(newestEntryDate(["README.md"])).toBeUndefined();
  });
});

describe("mergedPrsCommand", () => {
  it("lists app PRs merged on or after the date", () => {
    expect(mergedPrsCommand("2026-10-03")).toContain(
      'gh pr list --repo ddteeter/dialed.run --state merged --search "merged:>=2026-10-03"',
    );
  });

  it("refuses anything but a date", () => {
    expect(() => mergedPrsCommand("yesterday; rm -rf /")).toThrow(/not a date/);
  });
});
