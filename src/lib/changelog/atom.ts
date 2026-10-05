/**
 * /changelog.xml: an Atom feed with each entry's full text (M7). The app's
 * "What's new" row (M7b) reads it. Built only once there's an entry.
 */
import { isoDate, type ChangelogEntry } from "./entries";

function escape(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export interface FeedInput {
  /** Newest first. */
  entries: readonly ChangelogEntry[];
  pageUrl: string;
  feedUrl: string;
}

export function atomFeed({ entries, pageUrl, feedUrl }: FeedInput): string {
  const [newest] = entries;
  if (newest === undefined)
    throw new Error("an Atom feed needs at least one entry");
  const stamp = (date: Date) => `${isoDate(date)}T00:00:00Z`;

  const items = entries.map((entry) => {
    const url = `${pageUrl}#${entry.id}`;
    return [
      "  <entry>",
      `    <id>${escape(url)}</id>`,
      `    <title>${escape(entry.headline)}</title>`,
      `    <link rel="alternate" type="text/html" href="${escape(url)}"/>`,
      `    <published>${stamp(entry.date)}</published>`,
      `    <updated>${stamp(entry.date)}</updated>`,
      `    <category term="${entry.tag}"/>`,
      `    <content type="html">${escape(entry.html)}</content>`,
      "  </entry>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    `  <id>${escape(pageUrl)}</id>`,
    "  <title>dialed.run changelog</title>",
    "  <subtitle>What's new in dialed.run, newest first.</subtitle>",
    `  <link rel="self" type="application/atom+xml" href="${escape(feedUrl)}"/>`,
    `  <link rel="alternate" type="text/html" href="${escape(pageUrl)}"/>`,
    `  <updated>${stamp(newest.date)}</updated>`,
    "  <author><name>dialed.run</name></author>",
    ...items,
    "</feed>",
    "",
  ].join("\n");
}
