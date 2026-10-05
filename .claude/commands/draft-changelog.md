---
description: Draft changelog entries from merged dialed.run PRs, for the owner to approve
argument-hint: "[YYYY-MM-DD start date, needed while there are no entries]"
---

Draft changelog entries for dialed.run, following `docs/changelog-workflow.md` exactly.

1. Run `npm run changelog:since $ARGUMENTS` and then the `gh pr list` command it prints.
2. For each PR, read its "what a user sees" section and demo (`gh pr view <n> --repo ddteeter/dialed.run`). Keep only changes a runner can see or do.
3. Write one file per entry in `src/content/changelog/`, named `YYYY-MM-DD-short-slug.md` with the merge date, in the voice the workflow describes: what the runner can do now, a headline plus a sentence or two, tagged NEW, BETTER or FIXED, small fixes batched into one FIXED list. Never mention internals, PR numbers, lanes or tooling.
4. Run `npm run verify`.
5. On a new branch, commit the drafts and open a PR in this repo whose description maps each entry to the app PRs it covers.

Stop there. Never merge the PR and never publish an entry; the owner approves and merges.
