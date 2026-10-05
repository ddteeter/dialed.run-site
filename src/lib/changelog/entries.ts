/**
 * The changelog's rules that aren't the schema's: an entry's file name is
 * its anchor and starts with its own date, and the page groups entries by
 * month for the index (M7).
 */
export const TAGS = ["NEW", "BETTER", "FIXED"] as const;
export type Tag = (typeof TAGS)[number];

export interface ChangelogEntry {
  /** The file name without .md: "2026-10-03-typed-city". */
  id: string;
  date: Date;
  headline: string;
  tag: Tag;
  /** The body, rendered to HTML. */
  html: string;
  media?:
    | { kind: "image"; src: string; width: number; height: number; alt: string }
    | { kind: "video"; src: string; poster: string; alt: string };
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const ID = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Throws on a file name that isn't `YYYY-MM-DD-slug` for the entry's own date. */
export function checkEntryId(entry: Pick<ChangelogEntry, "id" | "date">): void {
  if (!ID.test(entry.id)) {
    throw new Error(
      `changelog entry ${entry.id}: name it YYYY-MM-DD-short-slug.md`,
    );
  }
  if (!entry.id.startsWith(isoDate(entry.date))) {
    throw new Error(
      `changelog entry ${entry.id}: its name must start with its date, ${isoDate(entry.date)}`,
    );
  }
}

/** Newest first, then by id so two entries on one day keep a stable order. */
export function newestFirst<T extends Pick<ChangelogEntry, "id" | "date">>(
  entries: T[],
): T[] {
  return [...entries].sort(
    (a, b) => b.date.getTime() - a.date.getTime() || b.id.localeCompare(a.id),
  );
}

const month = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
});
const day = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Oct 3, 2026", set in MONO.sm, which renders it uppercase. */
export function entryDate(date: Date): string {
  return day.format(date);
}

export interface MonthLink {
  label: string;
  /** The month's newest entry, which the index links to. */
  href: string;
}

/** The index: years, newest first, each with its months newest first. */
export function monthIndex(
  entries: readonly Pick<ChangelogEntry, "id" | "date">[],
): { year: number; months: MonthLink[] }[] {
  const years: { year: number; months: MonthLink[] }[] = [];
  for (const entry of entries) {
    const year = entry.date.getUTCFullYear();
    let group = years.find((y) => y.year === year);
    if (group === undefined) {
      group = { year, months: [] };
      years.push(group);
    }
    const label = month.format(entry.date);
    if (!group.months.some((m) => m.label === label)) {
      group.months.push({ label, href: `#${entry.id}` });
    }
  }
  return years;
}
