# dialed.run-site: CLAUDE.md

This is the marketing site for dialed.run, at the apex `dialed.run`. The app is a separate repo (`../dialed.run`) at `app.dialed.run`.

**Start with `docs/HANDOFF.md`.** It holds the decisions, the page specs, the data contract and the phases. Read it in full before writing code.

## Rules

- **Contracts outrank artboards.** Values come from `design-reference/contracts/tokens.js` and the T1 table in `design-reference/boards/Theme.dc.html`. Composition and copy come from `design-reference/boards/Marketing Site.dc.html`. Never measure a board.
- **`design-reference/` is a snapshot.** Never edit it; refresh it by re-copying from the app repo's `design/`.
- **This repo is public.**
  - Never write a secret, token or key into any file; secrets live in CI only.
  - No business strategy, plans or private notes in the docs.
  - Drafts of unannounced features stay on branches.
- **Privacy.** Guide data comes only from the app's nightly artifact. A band or sky section with fewer than 5 runners doesn't exist, so never render a placeholder for one. Nothing on this site identifies a runner except the owner's own published Call card.
- **Indexing.** `SITE_INDEXABLE` defaults to `false` (noindex everywhere) until the owner flips it at the public launch.
- **Changelog.** Claude drafts entries from merged app PRs, and the owner approves them through a PR. Never auto-publish.
- **Quality.** Strict TypeScript, lint, Prettier, Vitest for every generator, Playwright smoke and axe, HTML snapshots from the fixture, and a link check. A test pins the generated tokens against `tokens.js`.
- **Commits.** Small, each passing the checks. Open a PR for review, and don't push straight to `main` once CI exists.
