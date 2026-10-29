# Dependabot

Dependabot opens grouped PRs weekly (`.github/dependabot.yml`), each seven days behind a release.

- **Grouped:** minor and patch updates, one PR for production and one for development dependencies.
- **Alone:** a major version gets a PR of its own, so a major the tree can't take yet fails by itself instead of holding back the group.
- **Ignored:** `@types/node` majors. Node is pinned to 24 (`.nvmrc`), and its types move with that pin, by hand.

The flow is ported from dialed.run (its `docs/dependencies.md`), minus that repo's Claude impact review.

## What happens to an update

1. **Dependabot opens a PR.** Security updates skip the cooldown.
2. **If it moves a package the site ships, the open-source list is refreshed.** `/open-source` reads the committed `src/lib/oss/open-source-list.json`, which records each package's version. A build regenerates it at `postbuild`, and under `CI` a list that a build changes fails the build (HANDOFF §7). Dependabot can't run the build, so two workflows do it on each Dependabot npm PR:
   1. **Open-source list** (`oss-list.yml`, on `pull_request`, read-only) checks out the PR's head, runs `npm ci` and the build, and uploads the regenerated list as an artifact.
   2. **Commit the open-source list** (`oss-list-commit.yml`, on `workflow_run`) checks that artifact and commits it to the PR as the site's automation App. CI then runs again on that commit by itself.
3. **Dependabot PR** (`dependabot-pr.yml`) classifies it. If every package in it is an npm update that semver calls compatible (a minor at 1.0 or above, or a patch anywhere but 0.0.x), published by the same maintainers, auto-merge is armed. GitHub merges it with a merge commit, as the App, once `checks` passes on the head commit, and the push to `main` starts the deploy. GitHub arms auto-merge only while a check is pending, so if `checks` has already passed, the job merges at once, still only at the commit it classified.
4. **Anything else waits for you:** majors, 0.x minors, 0.0.x updates, new maintainers, and every GitHub Actions bump (Actions run with this repo's secrets, and the App can't merge a change to `.github/workflows/`).

**When a self-merging PR fails**, nothing merges and the PR stays open. Fix it on Dependabot's branch, or close it and let next week's run try again. **When a family can't move yet**, close its PR with a comment, or add an `ignore` for that major in `dependabot.yml` saying why and until when.

To refresh the list by hand instead: check out the PR's branch, run `npm run build`, and push the list.

## Setup (owner, once)

These are GitHub settings, so they don't show in the diff. Do them before the PR that adds the workflows merges, so the first Dependabot PR after it finds them.

1. **Create the site's automation App** (your account → Settings → Developer settings → GitHub Apps → New GitHub App). Its own App, not dialed.run's, so a leaked key reaches one repository.
   - Any name and homepage URL. Webhook: **Active** off.
   - Repository permissions: **Contents: Read and write** and **Pull requests: Read and write**, nothing else. Not `Workflows`, not `Administration`. (Metadata: read-only is added automatically.)
   - Where can it be installed: **Only on this account**.
   - Create it, note its **App ID**, and **Generate a private key**. The download is a `.pem` whose first line is `-----BEGIN RSA PRIVATE KEY-----`.
   - **Install App** → this account → **Only select repositories** → `dialed.run-site`.
2. **Environment `dependabot-merge`** (repo Settings → Environments): deployment branches and tags → **Selected branches** → `main`. Add the variable `AUTOMATION_APP_ID` (the App ID) and the secret `AUTOMATION_APP_PRIVATE_KEY` (the whole `.pem`, both header lines included).
3. **Settings → General:** Allow auto-merge on.
4. **Settings → Code security:** Dependabot alerts and Dependabot security updates on.
5. **Settings → Actions → General:**
   - Add `dependabot/fetch-metadata@*` to the allowed actions. (`actions/create-github-app-token` is GitHub's own.) An action that an allowed action calls must be allowed too.
   - Require approval for all external contributors' fork PRs.
   - Require actions to be pinned to a full-length commit SHA.
6. **Recommended, separately:** move the deploy secrets into a `production` environment limited to `main`. A merge now deploys without anyone watching.

Rotate the App's private key yearly: generate a new one, replace the secret, then delete the old key.

**If it fails:**

- "only PKCS#8 is supported": the secret isn't the App's `.pem` (an SSH key, for example).
- "401 A JSON web token could not be decoded": `AUTOMATION_APP_ID` is wrong.
- "Pull request is in unstable status" on `--auto`: every check had already passed. The job's fallback merges directly; a failure after that is real.
- `@dependabot rebase` fails on a grouped security PR, because it rebuilds the whole group. Merge `main` into its branch by hand.
- A re-run uses the workflow file from the original event, so a fix to a workflow doesn't apply to re-runs on older PRs. Close and reopen the PR, or wait for Dependabot's next push.

## Security

This repository is public: anyone can fork it, open a PR, and name a branch `dependabot/…`.

**Gates are on the PR's author, never on `github.actor`.** Under `pull_request_target` the actor is whoever caused the latest event, and there's a public technique for making Dependabot the actor of a `synchronize` on someone else's fork PR (BoostSecurity, "Weaponizing Dependabot"). Every job checks `pull_request.user.login` and the head repository. In `dependabot-pr.yml`, fetch-metadata checks the author, the head commit's author and its signature again, and fails otherwise. Its `skip-*-verification` inputs are never set. The one use of `github.actor` there only _skips_ classifying the App's own list commit.

**No PR code runs where a secret is.** `pull_request_target` and `workflow_run` run `main`'s copy of the workflow with this repo's secrets, so those jobs run nothing they check out, run no npm, and treat what they're handed as data. The PR's code runs only in `pull_request` jobs (CI and `oss-list.yml`), which Dependabot runs with a read-only token and no secrets.

**The App is a credential.** Its key in the wrong hands can merge arbitrary code to `main`, and so to production. So it's kept small: two permissions, no `workflows`, one repository, not a bypass actor (its merges wait on `checks`), in an environment only `main` can use, and minted only in the two jobs that need it, after their checks.

**The open-source list commit** trusts nothing about the run it follows:

- **It runs from `main`.** `workflow_run` always runs the default branch's file, so a PR, including Dependabot's own github-actions PRs, can't change it.
- **It checks where the run came from.** `workflow_run` holds secrets and a write-capable token even when the run it follows had none, and a fork can name a branch `dependabot/…`. The job requires all of these before it does anything:
  - the triggering run was `oss-list.yml` on a `pull_request` event, and succeeded;
  - its head repository is this one;
  - the branch matches `^dependabot/npm_and_yarn/[A-Za-z0-9._/-]+$`;
  - the API shows one open PR for that branch, authored by `dependabot[bot]`, in this repository.
- **It never puts event values into a script.** They reach `run:` steps only as environment variables, which are checked before use.
- **It treats the artifact as untrusted data.** The job downloads it into an empty directory, with `actions/download-artifact` past GHSA-cxww-7g56-2vh6. The artifact must be a single regular file under 1 MB, with the list's exact shape, checked with `jq`. Every project link must be `https://`; the page checks this again at build, and escapes all text. The file is written to one path, and the job refuses to commit if anything else changed.
- **It runs no code from the repo or its packages.** There's no `npm`, no cache, no `setup-node`, and git hooks are off. The checkout is used only by `git`. `GITHUB_TOKEN` has `actions: read` and `pull-requests: read`; only the App token can write.
- **It commits only onto what was built.** It checks out the exact head SHA that was built, and pushes without `--force`. If Dependabot has pushed since, the push fails instead of overwriting. If the PR's head no longer matches, the job stops, and the newer push's own run follows.

**What auto-merge does and doesn't change.** The real risk is a compromised release that survives the cooldown: it would merge, deploy, and run its install scripts in the deploy job. Merging by hand wouldn't catch that either, since nobody reads a lockfile diff. What does: the 7-day cooldown, holding back versions with new maintainers, and keeping the deploy's secrets in a `production` environment with a token scoped to what deploy needs.

**What's left:**

- A package with malicious metadata could get text or an `https` link onto `/open-source`. That's the same risk as regenerating the list by hand, and the cooldown reduces it.
- If an action pinned in these workflows were compromised upstream, it could use the App token: push to branches, or merge a PR that passes `checks`.
