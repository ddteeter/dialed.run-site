# Deploying dialed.run

The site is static: Astro builds `dist/`, and Cloudflare serves it as a Worker with static assets and no script (`wrangler.jsonc`). It shares the app's Cloudflare account, because the apex and `app.` are one DNS zone.

**Nothing deploys until the owner turns it on.** `.github/workflows/deploy.yml` runs only when the repository variable `DEPLOY_ENABLED` is `true`.

## What runs when

| Event              | Workflow     | What it does                                                                                                                         |
| ------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Every PR           | `ci.yml`     | Builds from the fixture, then runs the checks, unit and dist tests, link check, Playwright and axe, and Lighthouse. Uses no secrets. |
| Push to `main`     | `deploy.yml` | Builds from the real artifact and legal texts, deploys, and smoke-tests the live site.                                               |
| Nightly, 04:30 UTC | `deploy.yml` | The same, picking up the app's fresh 03:00 artifact. A failure opens an issue.                                                       |

## One-time setup

### 1. The deploy token (a secret)

Create a Cloudflare API token from the "Edit Cloudflare Workers" template, then trim it:

- **Keep:** Account → Workers Scripts → Edit, for this one account. Keep the zone permissions the template adds for routes and custom domains, scoped to the `dialed.run` zone only.
- **Remove:** Workers KV, R2, D1, Pages, and everything else the template includes that a static-assets Worker doesn't use.
- **Confirm the result** against Cloudflare's current token docs before saving. Then run a first deploy by hand (`workflow_dispatch`) to find any permission that's still missing.

**What this can't isolate.** As far as Cloudflare's token model goes today, Workers Scripts → Edit is account-wide: it isn't scoped to one Worker. A leaked token could deploy over any Worker in the account, the app's included, though not read its D1 or R2 data once those permissions are removed. **Accepted risk (owner, 2026-10-04):** a separate Cloudflare account and deploying from outside CI were both judged not worth it. Keep this token's permissions as narrow as the model allows, and rotate it if it might have leaked.

Then add these repository secrets:

| Secret                  | Value                                                           |
| ----------------------- | --------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | the scoped token above                                          |
| `CLOUDFLARE_ACCOUNT_ID` | the account's ID                                                |
| `R2_ACCESS_KEY_ID`      | a read-only R2 API token, scoped to the artifact's bucket alone |
| `R2_SECRET_ACCESS_KEY`  | its secret                                                      |

### 2. Repository variables (public values, not secrets)

| Variable                | Default                               | Notes                                                                                                                                                                                           |
| ----------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEPLOY_ENABLED`        | unset                                 | `true` turns deploys on.                                                                                                                                                                        |
| `GUIDE_ARTIFACT_BUCKET` | unset                                 | **Required to build.** The R2 bucket holding the app's nightly anonymous-totals artifact: `dialed-guides`.                                                                                      |
| `GUIDE_ARTIFACT_KEY`    | unset                                 | **Required to build.** Its object key: `guide-artifact/v1.json`. The deploy job downloads it with the R2 secrets above. A failed download fails the deploy; it never falls back to the fixture. |
| `SITE_INDEXABLE`        | `false`                               | `true` only at the public launch: robots.txt allows crawling, canonicals appear, and noindex goes away.                                                                                         |
| `LEGAL_SOURCE_REF`      | the SHA pinned in `src/config/env.ts` | The app repo ref that the legal texts are read from.                                                                                                                                            |
| `INVITE_ENDPOINT`       | unset                                 | `https://app.dialed.run/api/access-requests` once the app ships it. Until then, Request an invite links to the app's own page.                                                                  |
| `TURNSTILE_SITE_KEY`    | unset                                 | The app's public site key, with `dialed.run` in its allowed hostnames. Required with `INVITE_ENDPOINT`. Never put the secret here.                                                              |
| `GOATCOUNTER_ENDPOINT`  | unset                                 | The GoatCounter site's count URL, such as `https://dialedrun.goatcounter.com/count`. Unset means no analytics.                                                                                  |
| `APP_ORIGIN`            | `https://app.dialed.run`              |                                                                                                                                                                                                 |

### 3. `www` → apex

An assets-only Worker serves a matching file before any code could run, so it can't redirect by host. Use a zone **Redirect Rule** (Rules → Redirect Rules → Single Redirect):

- **When:** hostname equals `www.dialed.run`;
- **Then:** dynamic redirect to `concat("https://dialed.run", http.request.uri.path)`, status **301**, preserving the query string.

`www` needs a proxied DNS record, such as an `AAAA` record to `100::`, for the rule to see its traffic.

### 4. Repository settings

- Require the `CI / checks` status before merging to `main`, and don't allow direct pushes.
- Turn on "Require actions to be pinned to a full-length commit SHA". `ci.yml` also checks the pins on each PR, because the setting only applies when a job starts.

## Routing, as Cloudflare serves it

These are tested against `wrangler dev` in `tests/e2e/flows.spec.ts`:

- **One URL per page:** `/how-it-works` serves the page; `/how-it-works/` and `/how-it-works.html` 307 to it.
- **404s:** any path with no file gets `404.html` with a 404 status. That includes `/changelog` before its first entry and any unpublished legal text.
- **App paths:** `/feed`, `/login`, `/join`, `/account`, `/reset` and `/confirm`, and anything under them, 301 to `APP_ORIGIN` with the path and query intact (`dist/_redirects`).
- **Headers:** `dist/_headers` sends the CSP, `nosniff`, a referrer policy and, until launch, `X-Robots-Tag: noindex` on every response.

## The public launch

1. Set `SITE_INDEXABLE` to `true` and run the Deploy workflow.
2. Check that `https://dialed.run/robots.txt` allows crawling and that pages carry canonical URLs and no robots meta.
3. Phase 2 adds the guides and the sitemap.
