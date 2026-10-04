import { describe, expect, it } from "vitest";
import CallCard from "@/components/CallCard.astro";
import fixture from "@/data/fixtures/guide-artifact.json";
import { parseGuideArtifact } from "@/data/artifact/schema";
import Home from "@/pages/index.astro";
import { conditionsLine, dialedCount } from "@/lib/callCard";
import { serializeJsonLd, webApplication } from "@/lib/jsonLd";
import { parse, render } from "./render";

const card = parseGuideArtifact(fixture).callCard;
if (card === undefined) throw new Error("the fixture has a Call card");

describe("Call card formatting", () => {
  it("writes the conditions strip as the board does", () => {
    expect(conditionsLine(card)).toBe("38°F · FEELS 33° · DAMP");
  });

  it("writes each item's record", () => {
    expect(card.items.map(dialedCount)).toEqual([
      "7 of 9 dialed",
      "11 of 12 dialed",
      "5 of 6 dialed",
    ]);
  });
});

describe("CallCard", async () => {
  const doc = parse(await render(CallCard, { card }));

  it("is an ink block with a heading for screen readers", () => {
    const section = doc.querySelector("section");
    expect(section?.getAttribute("data-ground")).toBe("ink");
    expect(doc.querySelector("h2")?.textContent).toBe(
      "A real call from dialed.run",
    );
  });

  it("lists every item with its record", () => {
    const rows = [...doc.querySelectorAll("li")].map((li) =>
      [...li.querySelectorAll("span")].map((span) => span.textContent.trim()),
    );
    expect(rows).toEqual([
      ["Long sleeve, merino", "7 of 9 dialed"],
      ["Tights", "11 of 12 dialed"],
      ["Light gloves", "5 of 6 dialed"],
    ]);
  });

  it("carries the note", () => {
    expect(doc.body.textContent).toContain(card.note);
  });
});

describe("Home", async () => {
  const doc = parse(await render(Home, {}, { url: "https://dialed.run/" }));

  it("has one h1: the promise", () => {
    expect([...doc.querySelectorAll("h1")].map((h) => h.textContent)).toEqual([
      "Wear what worked.",
    ]);
  });

  it("puts both ways in side by side", () => {
    const hero = doc.querySelector("main h1")?.parentElement;
    const links = [...(hero?.querySelectorAll("a") ?? [])].map((a) => [
      a.textContent.trim(),
      a.getAttribute("href"),
    ]);
    expect(links).toEqual([
      ["Request an invite", "/invite"],
      ["Have a code? Join", "https://app.dialed.run/join"],
    ]);
  });

  it("shows the Call card from the artifact", () => {
    expect(doc.querySelector('[data-ground="ink"]')?.textContent).toContain(
      "38°F · FEELS 33° · DAMP",
    );
  });

  it("lists the three steps in order", () => {
    expect(
      [...doc.querySelectorAll("ol h3")].map((h) => h.textContent),
    ).toEqual(["Log the run", "Say how it went", "Get the call"]);
  });

  it("has no guide strip before guides are built", () => {
    expect(doc.body.textContent).not.toContain("shared runs");
  });
});

describe("JSON-LD", () => {
  it("describes dialed.run as a web application", () => {
    expect(webApplication("One sentence.")).toMatchObject({
      "@type": "WebApplication",
      name: "dialed.run",
      url: "https://dialed.run",
    });
  });

  it("can't be broken out of its script element", () => {
    const json = serializeJsonLd(
      webApplication("</script><script>alert(1)</script>"),
    );
    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toMatchObject({
      description: "</script><script>alert(1)</script>",
    });
  });
});
