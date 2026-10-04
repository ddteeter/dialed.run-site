import { describe, expect, it, vi } from "vitest";
import LegalPage from "@/pages/[legal].astro";
import { getLegalDocs } from "@/data/legal";
import { parseLegalDoc } from "@/lib/legal/markdown";
import {
  checkPublished,
  legalSourceUrl,
  loadLegalDocs,
} from "@/lib/legal/source";
import { parse, render } from "./render";

const MARK = "---\npublished: true\n---\n";
const REF = "1fb96e795314f5bf8d6c7e36a9d5035dc18044d4";

function githubFetch(files: Record<string, string>) {
  return vi.fn<typeof fetch>((input) => {
    const url = input instanceof Request ? input.url : input.toString();
    const file = Object.keys(files).find((name) =>
      url.endsWith(`/docs/legal/${name}`),
    );
    return Promise.resolve(
      file === undefined
        ? new Response("", { status: 404 })
        : new Response(files[file]),
    );
  });
}

describe("loadLegalDocs, from fixtures", () => {
  it("returns only the texts with the published mark", async () => {
    const docs = await loadLegalDocs({
      USE_FIXTURE_DATA: true,
      LEGAL_SOURCE_REF: REF,
    });
    expect([...docs.keys()]).toEqual(["privacy"]);
    expect(docs.get("privacy")?.title).toBe("[dialed.run] privacy policy");
  });
});

describe("loadLegalDocs, from the app repo", () => {
  const source = { USE_FIXTURE_DATA: false, LEGAL_SOURCE_REF: REF };

  it("fetches each text at the pinned ref", async () => {
    const fetchImpl = githubFetch({
      "privacy-policy.md": `${MARK}# Privacy\n\nWords.`,
      "terms.md": "# Terms\n\nDraft.",
      "copyright.md": "# Copyright\n\nDraft.",
    });
    const docs = await loadLegalDocs(source, fetchImpl);
    expect([...docs.keys()]).toEqual(["privacy"]);
    expect(fetchImpl).toHaveBeenCalledWith(legalSourceUrl(REF, "terms.md"));
    expect(legalSourceUrl(REF, "terms.md")).toBe(
      `https://raw.githubusercontent.com/ddteeter/dialed.run/${REF}/docs/legal/terms.md`,
    );
  });

  it("fails when a file is missing at the ref, rather than treating it as unpublished", async () => {
    const fetchImpl = githubFetch({ "privacy-policy.md": "# P" });
    await expect(loadLegalDocs(source, fetchImpl)).rejects.toThrow(
      /terms\.md: HTTP 404/,
    );
  });

  it("fails on a published text the page can't draw", async () => {
    const fetchImpl = githubFetch({
      "privacy-policy.md": `${MARK}# P\n\n![image](/a.png)\n`,
      "terms.md": "# T",
      "copyright.md": "# C",
    });
    await expect(loadLegalDocs(source, fetchImpl)).rejects.toThrow(
      /privacy-policy\.md can't be drawn/,
    );
  });
});

describe("checkPublished", () => {
  const doc = (text: string) => parseLegalDoc(text);

  it("refuses a published text that still has an [OWNER: note", () => {
    const text = "# P\n\nEffective [OWNER: date].";
    expect(() => {
      checkPublished("privacy", text, doc(text), new Set(["privacy"]));
    }).toThrow(/\[OWNER: …\] note/);
  });

  it("refuses a link to a legal page that isn't published", () => {
    const text = "# P\n\nSee the [Terms](/terms).";
    expect(() => {
      checkPublished("privacy", text, doc(text), new Set(["privacy"]));
    }).toThrow(
      "privacy-policy.md links to /terms, but terms.md isn't published",
    );
    expect(() => {
      checkPublished("privacy", text, doc(text), new Set(["privacy", "terms"]));
    }).not.toThrow();
  });

  it("refuses an anchor that isn't one of the text's sections", () => {
    const text = "# P\n\nSee [below](#nowhere).\n\n## Somewhere\n";
    expect(() => {
      checkPublished("privacy", text, doc(text), new Set(["privacy"]));
    }).toThrow(/#nowhere, which isn't one of its sections/);
  });
});

describe("the legal route", () => {
  it("renders a published text in the reading layout, with its contents", async () => {
    const privacy = (await getLegalDocs()).get("privacy");
    const html = await render(
      LegalPage,
      { doc: privacy, label: "Privacy policy" },
      { url: "https://dialed.run/privacy" },
    );
    const page = parse(html);
    expect(page.querySelector("h1")?.textContent).toBe(
      "[dialed.run] privacy policy",
    );
    expect(
      [...page.querySelectorAll("#contents a")].map((a) =>
        a.getAttribute("href"),
      ),
    ).toEqual([
      "#what-we-keep-and-why",
      "#weather-and-location",
      "#your-choices",
    ]);
    for (const id of [
      "what-we-keep-and-why",
      "weather-and-location",
      "your-choices",
    ]) {
      expect(page.getElementById(id)?.tagName).toBe("H2");
    }
  });
});
