# Changelog workflow

The changelog at `/changelog` (and its Atom feed, `/changelog.xml`) tells runners what changed in the app. **Claude drafts entries from merged app PRs, and the owner approves them in a PR here.** Nothing is ever auto-merged or auto-published.

Until the first entry is merged, `/changelog`, its feed and its footer link don't exist.

## Steps

1. **Find the start date and the merged PRs.**

   ```sh
   npm run changelog:since              # from the newest entry's date
   npm run changelog:since -- 2026-09-01   # while there are no entries yet
   ```

   It prints a `gh pr list --repo ddteeter/dialed.run --state merged --search "merged:>=YYYY-MM-DD"` command. Run it. A PR merged on the start date may already have an entry, so check the newest entries before drafting.

2. **Keep only runner-visible changes.** Read each PR's "what a user sees" section and its demo. Leave out anything a runner can't see or do: refactors, tests, tooling, infrastructure, the Desk, docs.

3. **Draft the entries**, one Markdown file per entry, in `src/content/changelog/`, named `YYYY-MM-DD-short-slug.md` with the merge date (see `src/content/changelog/README.md` for the front matter):
   - **Say what the runner can do now, not what we built.** "Type a city instead." not "Added geocoding."
   - **One headline and a sentence or two**, in the board's voice: plain, specific, second person.
   - **Tag it** `NEW` (something they couldn't do before), `BETTER` (something they could do, improved) or `FIXED`.
   - **Batch small fixes** into one `FIXED` entry with a list ("Three small fixes").
   - **Never** mention internals, lanes, PR numbers, branch names, tooling, or anything unannounced.
   - **Media is optional:** a screenshot or a short clip from the PR's demo, with alt text.

4. **Open a PR in this repo** with the drafts, listing which app PRs each entry covers (in the PR description, not in the entries). The owner edits and approves it. The owner merges; Claude never does.

## With Claude Code

`/draft-changelog` (`.claude/commands/draft-changelog.md`) runs these steps and stops at the PR.
