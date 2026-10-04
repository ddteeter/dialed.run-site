/**
 * The generated HTML of the fixture build, pinned. A change to a page's
 * markup shows up here as a diff to review; `npx vitest run --project dist
 * -u` accepts it. Hashed asset names are normalised so a rebuild with the
 * same markup doesn't churn. Guide pages join when the guides are built.
 */
import { describe, expect, it } from "vitest";
import { readDist } from "./helpers";

function normalise(html: string): string {
  return html
    .replaceAll(
      /\/_astro\/([\w-]+?)\.[\w-]{8}\.(css|js|woff2|png|webp|avif)/g,
      "/_astro/$1.[hash].$2",
    )
    .replaceAll(/ data-astro-cid-[a-z0-9]+(="")?/g, "")
    .replaceAll(/<meta name="generator"[^>]*>/g, "")
    .replaceAll(/></g, ">\n<");
}

describe("HTML snapshots, fixture build", () => {
  it.each(["index.html", "invite.html", "privacy.html", "404.html"])(
    "%s",
    async (page) => {
      await expect(normalise(readDist(page))).toMatchFileSnapshot(
        `__snapshots__/${page}`,
      );
    },
  );
});
