/**
 * Where the next changelog draft starts: the newest entry's date, from the
 * entry file names (YYYY-MM-DD-slug.md). With no entries there's no safe
 * default, so the caller must name a date.
 */
const DATED = /^(\d{4}-\d{2}-\d{2})-[a-z0-9-]+\.md$/;

export function newestEntryDate(
  fileNames: readonly string[],
): string | undefined {
  const dates = fileNames.flatMap(
    (name) => DATED.exec(name)?.slice(1, 2) ?? [],
  );
  return dates.sort().at(-1);
}

export function mergedPrsCommand(since: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since))
    throw new Error(`not a date: ${since}`);
  return `gh pr list --repo ddteeter/dialed.run --state merged --search "merged:>=${since}" --limit 200 --json number,title,mergedAt,body,url`;
}
