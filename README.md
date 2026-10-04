# dialed.run-site

The marketing site for [dialed.run](https://dialed.run), built with Astro and served by Cloudflare as static assets. The app is a separate repo, at `app.dialed.run`.

`docs/HANDOFF.md` holds the decisions, page specs and data contract. `docs/deploy.md` covers hosting, and `docs/changelog-workflow.md` covers the changelog.

## Run it locally

You need Node 24 (`.nvmrc`; Volta picks it up from `package.json`). The link check also needs [lychee](https://lychee.cli.rs) (`brew install lychee`).

```sh
npm install
npx playwright install chromium   # once, for the e2e suite and Lighthouse
npm run dev                       # http://localhost:4321, from the fixture data
```

| Command                   | What it does                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `npm run verify`          | Format check, lint, `astro check` and `tsc`, unit tests, a fixture build, and the dist and snapshot tests.     |
| `npm run verify:all`      | `verify`, then the link check and the Playwright suite (axe, routing, contract checks) against `wrangler dev`. |
| `npm run lighthouse`      | Lighthouse budgets on Home, Invite and How it works.                                                           |
| `npm run theme`           | Regenerates the theme and font CSS from `design-reference/` (`tokens.js` and the T1 table).                    |
| `npm run og`              | Re-renders the Open Graph card, `public/og.png`.                                                               |
| `npm run changelog:since` | Prints the `gh` command that lists the app PRs to draft entries from.                                          |

## Configuration

Everything is a public build-time variable (`src/config/env.ts`); there are no secrets in the build.

| Variable                                | Default                  |                                                                                                               |
| --------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `USE_FIXTURE_DATA`                      | `false`                  | `true` reads `src/data/fixtures/` (guide artifact and legal texts). `npm run dev` and `build:fixture` set it. |
| `GUIDE_ARTIFACT_URL`                    | unset                    | The app's nightly artifact. Required unless `USE_FIXTURE_DATA=true`.                                          |
| `SITE_INDEXABLE`                        | `false`                  | Only `true` or `false`; anything else fails the build.                                                        |
| `LEGAL_SOURCE_REF`                      | a pinned SHA             | The app repo ref the legal texts are read from.                                                               |
| `INVITE_ENDPOINT`, `TURNSTILE_SITE_KEY` | unset                    | Switch Invite from a link to the app's request page to a form.                                                |
| `APP_ORIGIN`                            | `https://app.dialed.run` |                                                                                                               |

## Where things live

- `design-reference/`: the design snapshot. Read-only; refresh it by re-copying.
- `src/theme/`: derives `src/styles/*.generated.css` from the contracts, and the contract lint.
- `src/data/`: the guide artifact (schema, loader, fixture), the legal texts and the changelog.
- `src/pages/`: Home, Invite, How it works, `/open-source`, the 404, and `[page].astro` for the pages that exist only when their content does (legal texts, changelog).
- `test/`: Vitest unit tests; `test/dist/`, checks on the built site and HTML snapshots.
- `tests/e2e/`: Playwright against `wrangler dev`.
