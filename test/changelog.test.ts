import { DOMParser } from "linkedom";
import { describe, expect, it } from "vitest";
import ChangelogPage from "@/components/changelog/ChangelogPage.astro";
import { getChangelogEntries } from "@/data/changelog";
import { atomFeed } from "@/lib/changelog/atom";
import {
  checkEntryId,
  entryDate,
  monthIndex,
  newestFirst,
  type ChangelogEntry,
} from "@/lib/changelog/entries";
import { parse, render } from "./render";

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);

const ENTRIES: ChangelogEntry[] = newestFirst([
  {
    id: "2026-09-11-three-fixes",
    date: day("2026-09-11"),
    headline: "Three small fixes",
    tag: "FIXED",
    html: "<ul><li>One.</li><li>Two & three.</li></ul>",
  },
  {
    id: "2026-10-03-typed-city",
    date: day("2026-10-03"),
    headline: "Get the call without sharing your location",
    tag: "NEW",
    html: "<p>Type a city instead.</p>",
    media: {
      kind: "video",
      src: "/changelog/typed-city.mp4",
      poster: "/changelog/typed-city.jpg",
      alt: "Typing a city",
    },
  },
  {
    id: "2026-09-24-start-time",
    date: day("2026-09-24"),
    headline: "Fix a run's start time",
    tag: "BETTER",
    html: "<p>Tap the time on the run card.</p>",
  },
]);

describe("changelog entries", () => {
  it("sorts newest first", () => {
    expect(ENTRIES.map((e) => e.id)).toEqual([
      "2026-10-03-typed-city",
      "2026-09-24-start-time",
      "2026-09-11-three-fixes",
    ]);
  });

  it("accepts a file named for its own date", () => {
    expect(() => {
      checkEntryId({ id: "2026-10-03-typed-city", date: day("2026-10-03") });
    }).not.toThrow();
  });

  it.each([
    ["typed-city", "2026-10-03", /name it YYYY-MM-DD-short-slug/],
    ["2026-10-03", "2026-10-03", /name it YYYY-MM-DD-short-slug/],
    ["2026-10-03-Typed_City", "2026-10-03", /name it YYYY-MM-DD-short-slug/],
    [
      "2026-10-02-typed-city",
      "2026-10-03",
      /must start with its date, 2026-10-03/,
    ],
  ])("refuses %s dated %s", (id, date, message) => {
    expect(() => {
      checkEntryId({ id, date: day(date) });
    }).toThrow(message);
  });

  it("writes dates as the board does, in UTC", () => {
    expect(entryDate(day("2026-10-03"))).toBe("Oct 3, 2026");
  });

  it("indexes months newest first, linking each to its newest entry", () => {
    expect(monthIndex(ENTRIES)).toEqual([
      {
        year: 2026,
        months: [
          { label: "October", href: "#2026-10-03-typed-city" },
          { label: "September", href: "#2026-09-24-start-time" },
        ],
      },
    ]);
  });

  it("has no entries yet, so no page", async () => {
    expect(await getChangelogEntries()).toEqual([]);
  });
});

describe("atomFeed", () => {
  const xml = atomFeed({
    entries: ENTRIES,
    pageUrl: "https://dialed.run/changelog",
    feedUrl: "https://dialed.run/changelog.xml",
  });
  const doc = new DOMParser().parseFromString(
    xml,
    "text/xml",
  ) as unknown as Document;

  it("is well-formed Atom", () => {
    expect(doc.documentElement.tagName).toBe("feed");
    expect(doc.documentElement.getAttribute("xmlns")).toBe(
      "http://www.w3.org/2005/Atom",
    );
  });

  it("is updated as of its newest entry", () => {
    expect(doc.querySelector("feed > updated")?.textContent).toBe(
      "2026-10-03T00:00:00Z",
    );
  });

  it("carries every entry newest first, with a dated anchor and the full text", () => {
    const entries = [...doc.querySelectorAll("entry")];
    expect(entries.map((e) => e.querySelector("id")?.textContent)).toEqual([
      "https://dialed.run/changelog#2026-10-03-typed-city",
      "https://dialed.run/changelog#2026-09-24-start-time",
      "https://dialed.run/changelog#2026-09-11-three-fixes",
    ]);
    expect(entries[2]?.querySelector("content")?.textContent).toBe(
      "<ul><li>One.</li><li>Two & three.</li></ul>",
    );
    expect(entries[0]?.querySelector("category")?.getAttribute("term")).toBe(
      "NEW",
    );
  });

  it("escapes markup in titles", () => {
    const [first] = ENTRIES;
    if (first === undefined) throw new Error("no entries");
    const tricky = atomFeed({
      entries: [{ ...first, headline: "Runs <b>&</b> more" }],
      pageUrl: "https://dialed.run/changelog",
      feedUrl: "https://dialed.run/changelog.xml",
    });
    expect(tricky).toContain(
      "<title>Runs &lt;b&gt;&amp;&lt;/b&gt; more</title>",
    );
  });

  it("refuses to build an empty feed", () => {
    expect(() =>
      atomFeed({
        entries: [],
        pageUrl: "https://dialed.run/changelog",
        feedUrl: "x",
      }),
    ).toThrow(/at least one entry/);
  });
});

describe("ChangelogPage", async () => {
  const doc = parse(
    await render(
      ChangelogPage,
      { entries: ENTRIES },
      { url: "https://dialed.run/changelog" },
    ),
  );

  it("gives each entry its dated anchor", () => {
    expect([...doc.querySelectorAll("ol > li")].map((li) => li.id)).toEqual(
      ENTRIES.map((e) => e.id),
    );
  });

  it("shows each tag as plain text in a box, never on a fill", () => {
    const tags = [...doc.querySelectorAll("ol > li span.border")];
    expect(tags.map((t) => t.textContent)).toEqual(["NEW", "BETTER", "FIXED"]);
    for (const tag of tags) expect(tag.className).not.toMatch(/\bbg-/);
  });

  it("links the feed from the page and the head", () => {
    expect(doc.querySelector('a[href="/changelog.xml"]')?.textContent).toBe(
      "RSS feed",
    );
    expect(
      doc.querySelector('link[rel="alternate"][type="application/atom+xml"]'),
    ).not.toBeNull();
  });

  it("plays a clip only when asked: no autoplay", () => {
    const video = doc.querySelector("video");
    expect(video?.hasAttribute("controls")).toBe(true);
    expect(video?.hasAttribute("autoplay")).toBe(false);
  });
});
