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
- **Privacy.** Guide and report figures come only from the app's nightly anonymous-totals artifact. The app counts shared _and_ private runs (D-108), reading only the counted fields: feels-like band, sky, month, garment type and model, verdict, and region where a runner set one. It never reads notes, photos, times, places or handles. Only confirmed accounts count, opted-out runners are excluded, and every figure has at least 5 distinct runners behind it (20 for a brand). A band, sky section or cell below that threshold doesn't exist: never render a placeholder or 'fewer than 5'. Nothing on this site identifies a runner, except the owner's own published Call card. The disclosure copy (M2, M3's footer line, M4's 'How the guides are made' at `#totals`) follows the Marketing Site board as updated in round 32.
- **Indexing.** `SITE_INDEXABLE` defaults to `false` (noindex everywhere) until the owner flips it at the public launch.
- **Changelog.** Claude drafts entries from merged app PRs, and the owner approves them through a PR. Never auto-publish.
- **Quality.** Strict TypeScript, lint, Prettier, Vitest for every generator, Playwright smoke and axe, HTML snapshots from the fixture, and a link check. A test pins the generated tokens against `tokens.js`.
- **Commits.** Small, each passing the checks. Open a PR for review, and don't push straight to `main` once CI exists.

## Before calling work done

- `npm run verify:all`: format, lint, types (`astro check` and `tsc`), unit tests, the fixture build, the dist and snapshot tests, the link check, and Playwright with axe against `wrangler dev`. Run `npm run lighthouse` too when a page's weight or markup changed.
- Use the npm scripts, never bare `npx tsc` or `npx astro`: the scripts carry the flags and the order.
- A theme or font change: `npm run theme` (and `npm run og` if the card's type or colour moved), then commit the generated files.
- A markup change that the snapshots catch: review the diff, then `npx vitest run --project dist -u`.
- Node 24 is pinned with Volta. A newer system Node on `PATH` breaks some tools, so put `~/.volta/bin` first.
