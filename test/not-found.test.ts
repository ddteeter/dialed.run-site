import { describe, expect, it } from "vitest";
import NotFound from "@/pages/404.astro";
import { parse, render } from "./render";

describe("404", async () => {
  const doc = parse(
    await render(NotFound, {}, { url: "https://dialed.run/404" }),
  );

  it("says so, with one h1", () => {
    expect(
      [...doc.querySelectorAll("h1")].map((h) => h.textContent.trim()),
    ).toEqual(["Nothing at this address"]);
    expect(doc.querySelector("title")?.textContent).toBe(
      "Not found · dialed.run",
    );
  });

  it("stays out of search", () => {
    expect(
      doc.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("noindex");
  });

  it("offers a way on, and no invite pitch in the page itself", () => {
    const main = doc.querySelector("main");
    expect(
      [...(main?.querySelectorAll("a") ?? [])].map((a) =>
        a.getAttribute("href"),
      ),
    ).toEqual(["/"]);
  });
});
