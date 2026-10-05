/**
 * The changelog's entries for this build, newest first. Zero entries means
 * no /changelog, no feed and no footer link (design round 31 #5a).
 */
import { getCollection } from "astro:content";
import {
  checkEntryId,
  newestFirst,
  type ChangelogEntry,
} from "@/lib/changelog/entries";

// Checked first so an empty changelog doesn't make Astro warn on every page.
const files = import.meta.glob("../content/changelog/[0-9]*.md");

export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  if (Object.keys(files).length === 0) return [];
  const entries = (await getCollection("changelog")).map(
    (entry): ChangelogEntry => {
      const { date, headline, tag, media } = entry.data;
      const item: ChangelogEntry = {
        id: entry.id,
        date,
        headline,
        tag,
        html: entry.rendered?.html ?? "",
      };
      checkEntryId(item);
      if (media?.kind === "image") {
        item.media = {
          kind: "image",
          src: media.src.src,
          width: media.src.width,
          height: media.src.height,
          alt: media.alt,
        };
      } else if (media?.kind === "video") {
        item.media = media;
      }
      return item;
    },
  );
  return newestFirst(entries);
}
