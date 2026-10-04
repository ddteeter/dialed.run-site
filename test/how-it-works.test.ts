import { describe, expect, it } from "vitest";
import VerdictRow from "@/components/VerdictRow.astro";
import { FAQS } from "@/data/content/how-it-works";
import HowItWorks from "@/pages/how-it-works.astro";
import { parse, render } from "./render";

describe("How it works", async () => {
  const doc = parse(
    await render(HowItWorks, {}, { url: "https://dialed.run/how-it-works" }),
  );

  it("has one h1", () => {
    expect([...doc.querySelectorAll("h1")].map((h) => h.textContent)).toEqual([
      "How it works",
    ]);
  });

  it("lists every section in the contents, each with its anchor on the page", () => {
    const anchors = [...doc.querySelectorAll("#contents a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(anchors).toEqual([
      "#the-loop",
      "#the-verdict",
      "#the-call",
      "#totals",
      "#questions",
    ]);
    for (const anchor of anchors) {
      expect(doc.getElementById(String(anchor).slice(1))?.tagName).toBe("H2");
    }
  });

  it("explains how the guides are made at #totals (design round 32)", () => {
    const totals = doc.getElementById("totals")?.parentElement;
    expect(totals?.textContent).toContain("at least 5 different runners");
    expect(totals?.textContent).toContain("20 if it's about a brand");
    expect(totals?.textContent).toContain("Confirmed accounts only");
  });

  it("marks How it works as the current page in the nav", () => {
    const current = doc.querySelector('nav a[aria-current="page"]');
    expect(current?.textContent.trim()).toBe("How it works");
  });

  it("states the same questions and answers in the page and the FAQPage JSON-LD", () => {
    const shown = [...doc.querySelectorAll("#questions ~ div")].map((row) => ({
      question: row.querySelector("h3")?.textContent.trim(),
      answer: row.querySelector("p")?.textContent.trim(),
    }));
    expect(shown).toEqual(FAQS);

    const block = [
      ...doc.querySelectorAll('script[type="application/ld+json"]'),
    ]
      .map((script) => JSON.parse(script.textContent) as { "@type": string })
      .find((node) => node["@type"] === "FAQPage") as
      | { mainEntity: { name: string; acceptedAnswer: { text: string } }[] }
      | undefined;
    expect(
      block?.mainEntity.map((q) => ({
        question: q.name,
        answer: q.acceptedAnswer.text,
      })),
    ).toEqual(FAQS);
  });

  it("answers the round 32 questions", () => {
    expect(FAQS.map((f) => f.question)).toContain(
      "Can I keep my runs out of the guides?",
    );
    expect(
      FAQS.find((f) => f.question === "Who sees my runs?")?.answer,
    ).toContain("never with your name");
  });
});

describe("VerdictRow", async () => {
  const doc = parse(await render(VerdictRow));

  it("is one image with a sentence for a name", () => {
    const img = doc.querySelector('[role="img"]');
    expect(img?.getAttribute("aria-label")).toBe(
      "Verdict scale: way cold to way warm, Dialed selected",
    );
  });

  it("draws the five words in order, Dialed selected on the teal surface", () => {
    const slots = [...doc.querySelectorAll('[role="img"] > span')];
    expect(
      slots.map((s) =>
        s.innerHTML
          .replaceAll(/<br[^>]*>/g, " ")
          .replaceAll(/\s+/g, " ")
          .trim(),
      ),
    ).toEqual(["Way cold", "A bit cold", "Dialed", "A bit warm", "Way warm"]);
    expect(slots[2]?.className).toContain("bg-dialed-surface");
    expect(slots.filter((s) => s.className.includes("bg-action"))).toEqual([]);
  });
});
