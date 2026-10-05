/**
 * Prints where the next changelog draft starts and the command that lists
 * the app PRs merged since then. See docs/changelog-workflow.md.
 *
 *   npm run changelog:since              # from the newest entry's date
 *   npm run changelog:since -- 2026-09-01   # needed while there are no entries
 */
import { readdirSync } from "node:fs";
import {
  mergedPrsCommand,
  newestEntryDate,
} from "../src/lib/changelog/since.ts";

const given = process.argv[2];
const newest = newestEntryDate(
  readdirSync(new URL("../src/content/changelog/", import.meta.url)),
);
const since = given ?? newest;
if (since === undefined) {
  console.error(
    "No changelog entries yet: pass a start date, e.g. npm run changelog:since -- 2026-09-01",
  );
  process.exit(1);
}
console.log(
  `Draft entries for app PRs merged on or after ${since}${given ? "" : " (the newest entry)"}:`,
);
console.log(mergedPrsCommand(since));
