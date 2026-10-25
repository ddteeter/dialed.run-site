# Dependabot

Dependabot opens grouped PRs weekly (`.github/dependabot.yml`), each seven days behind a release.

- **Grouped:** minor and patch updates, one PR for production and one for development dependencies.
- **Alone:** a major version gets a PR of its own, so a major the tree can't take yet fails by itself instead of holding back the group.
- **Ignored:** `@types/node` majors. Node is pinned to 24 (`.nvmrc`), and its types move with that pin, by hand.

## The open-source list on Dependabot PRs

`/open-source` reads the committed `src/lib/oss/open-source-list.json`, which records each package's version. A build regenerates it at `postbuild`, and under `CI` a list that a build changes fails the build (HANDOFF §7). Dependabot can't run the build, so two workflows do it on each Dependabot npm PR:

1. **Open-source list** (`oss-list.yml`, on `pull_request`, read-only) checks out the PR's head, runs `npm ci` and the fixture build, and uploads the regenerated list as an artifact.
2. **Commit the open-source list** (`oss-list-commit.yml`, on `workflow_run`, write) checks that artifact and commits it to the PR as `github-actions[bot]`.

**What to do:** the bot's commit starts CI in an "approval required" state, because it was pushed with `GITHUB_TOKEN`. Look at the PR first: the bot's commit must change `open-source-list.json` and nothing else. Then approve the run. When Dependabot updates the PR, it rebases over the bot's commit (the message carries `[dependabot skip]`), and the two workflows run again.

## Security

The first workflow runs the bumped packages' code, as CI already does on every PR. It has a read-only token and no secrets: there are no Dependabot secrets, and Actions secrets are never passed to a Dependabot run. The second workflow holds the only write token, so it is built to trust nothing it's handed:

- **It runs from `main`.** `workflow_run` always runs the default branch's file, so a PR, including Dependabot's own github-actions PRs, can't change it. A `pull_request` job would run the PR's copy instead.
- **It checks where the run came from.** `workflow_run` gets a write token even when the run it follows had none, and a fork can name a branch `dependabot/…`. The job requires all of these before it does anything:
  - the triggering run was `oss-list.yml` on a `pull_request` event, and succeeded;
  - its head repository is this one;
  - the branch matches `^dependabot/npm_and_yarn/[A-Za-z0-9._/-]+$`;
  - the API shows one open PR for that branch, authored by `dependabot[bot]`, in this repository.
- **It never puts event values into a script.** They reach `run:` steps only as environment variables, which are checked before use.
- **It treats the artifact as untrusted data.** The job downloads it into an empty directory, with `actions/download-artifact` past GHSA-cxww-7g56-2vh6. The artifact must be a single regular file under 1 MB, with the list's exact shape, checked with `jq`. Every project link must be `https://`; the page checks this again at build, and escapes all text. The file is written to one path, and the job refuses to commit if anything else changed.
- **It runs no code from the repo or its packages.** There's no `npm`, no cache, no `setup-node`, and git hooks are off. The checkout is used only by `git`. The token has `contents: write`, `actions: read` and `pull-requests: read`, on that one job.
- **It commits only onto what was built.** It checks out the exact head SHA that was built, and pushes without `--force`. If Dependabot has pushed since, the push fails instead of overwriting. If the PR's head no longer matches, the job stops, and the newer push's own run follows.
- **It can't deploy.** `main` requires the `checks` status, enforces this for admins, and refuses force-pushes. A push made with `GITHUB_TOKEN` starts no workflow except an approval-gated PR run, and deploys run only on pushes to `main`.

**What's left:**

- A package with malicious metadata could get text or an `https` link onto the page after you merge. That's the same risk as regenerating the list by hand, and it's reduced by the cooldown and by reviewing the diff before approving.
- If an action pinned in the second workflow were compromised upstream, the token could push branches or tags, which deploy nothing.
- Approving runs without looking defeats the gate.

To refresh the list by hand instead: check out the PR's branch, run `npm run build`, and push the list.
