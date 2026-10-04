import { describe, expect, it } from "vitest";
import SiteFooter from "@/components/SiteFooter.astro";
import SiteHeader from "@/components/SiteHeader.astro";
import type { LegalSlug } from "@/data/legal";
import { parse, render } from "./render";

const texts = (doc: Document, selector: string) =>
  [...doc.querySelectorAll(selector)].map((el) => el.textContent.trim());

describe("SiteHeader", async () => {
  const doc = parse(
    await render(SiteHeader, {}, { url: "https://dialed.run/" }),
  );

  it("links How it works, Log in and Request an invite, in that order", () => {
    expect(texts(doc, "nav a")).toEqual([
      "How it works",
      "Log in",
      "Request an invite",
    ]);
  });

  it("logs in on the app's host", () => {
    const login = [...doc.querySelectorAll("nav a")].find(
      (a) => a.textContent.trim() === "Log in",
    );
    expect(login?.getAttribute("href")).toBe("https://app.dialed.run/login");
  });

  it("keeps only Log in below the wide breakpoint", () => {
    const items = [...doc.querySelectorAll("nav li")];
    const visibleAtPhone = items.filter(
      (li) => !li.className.split(" ").includes("hidden"),
    );
    expect(visibleAtPhone.map((li) => li.textContent.trim())).toEqual([
      "Log in",
    ]);
  });

  it("has no What to wear link until a guide is published", () => {
    expect(texts(doc, "nav a")).not.toContain("What to wear");
  });
});

describe("SiteFooter", () => {
  const footer = async (published: LegalSlug[], hasChangelog = true) =>
    texts(
      parse(
        await render(SiteFooter, {
          published: new Set(published),
          hasChangelog,
        }),
      ),
      "a",
    );

  it("leaves out every unpublished legal text", async () => {
    expect(await footer([])).toEqual(["Changelog", "Open source"]);
  });

  it("leaves out the changelog until it has an entry", async () => {
    expect(await footer([], false)).toEqual(["Open source"]);
  });

  it("lists published legal texts in the board's order", async () => {
    expect(await footer(["copyright", "terms", "privacy"])).toEqual([
      "Changelog",
      "Privacy policy",
      "Terms",
      "Open source",
      "Copyright",
    ]);
  });

  it("credits the weather provider", async () => {
    const doc = parse(
      await render(SiteFooter, { published: new Set(), hasChangelog: false }),
    );
    expect(doc.querySelector("footer")?.textContent).toContain(
      "Weather by Visual Crossing",
    );
  });
});
