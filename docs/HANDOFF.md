# dialed.run marketing site: implementation handoff

This repo will be the **marketing site for dialed.run**, served at the apex `dialed.run`. The app lives in a separate repo (`../dialed.run`) and will be served at `app.dialed.run`. Nothing is scaffolded yet. You're starting from this document, the design references in `design-reference/`, and the owner's decisions below.

Read this whole document before writing code. Where it says **OPEN**, the owner hasn't decided yet: build to the stated default and list the question in your PR.

---

## 1. Decisions already made (owner, 2026-10-03)

- **This is a separate, public repo.** It's not part of the app repo. The app repo runs a 100% mutation-testing ratchet and an hours-long push gate, which is the right tool for the app and the wrong one for marketing copy. This repo gets lighter, ordinary quality gates (see §11).
- **The stack is Astro, deployed to Cloudflare.** The owner's blog (`../biglongrun.com`, read-only reference) is Astro on Cloudflare too, so reuse its patterns (§10).
- **Two hosts.** `dialed.run` is the marketing site: indexable once the public launch flag is on. `app.dialed.run` is the app: never indexed, and its auth cookies are scoped to that host only. The app-side move to `app.dialed.run` happens in the app's deployment sweep, not here.
- **Guide data reaches this site as one nightly JSON artifact.** The app computes it and writes it to R2, and this site's nightly build reads it (§6). This site never queries the app's database or calls an authenticated API.
- **Claude drafts changelog entries, and the owner approves them** (§8). Entries are never auto-published.
- **The public repo carries no secrets** (only CI secrets) and **no business strategy or plans** in its docs. Drafts of unannounced features stay on branches.

## 2. Design sources and how to read them

`design-reference/` is a **snapshot** copied from the app repo's design archive. Don't edit it. Refresh it by re-copying when the design changes.

- `boards/Marketing Site.dc.html` (plus `- Dark`) is **the** design for this site: screens M0–M7 with notes. `boards/Integration Opportunities.dc.html` covers the biglongrun block and the published-record API, which is mostly app-side and later. `boards/Logo Directions.dc.html`, `boards/Brand Brief.dc.html` and `boards/Theme.dc.html` hold the T1 colour table.
- `contracts/`: `tokens.js` (type, mono ramp, spacing, radius, breakpoints, measures), `Form Contract`, `Accessibility Contract`, `Desktop Contract`, `Motion Doctrine` and `motion.js`, and `icons.js` (the icon pack).
- `fonts/`: Archivo (variable), Archivo Black and IBM Plex Mono (400 and 500), as latin and latin-ext WOFF2 files. These are the same files the app ships, all under the SIL Open Font License.

**Contracts outrank artboards.** This is the app repo's hardest-won rule, and it applies here too:
- **Contracts are the truth for values.** Every number you type comes from `tokens.js` or the T1 table.
- **Artboards are the truth for composition:** what's on a screen, the hierarchy, and the copy.
- **Never measure a board.** If a board shows a size that isn't in `tokens.js`, it's a collapse to the nearest token, not a new value.

Read boards by stripping tags (`sed -e 's/<[^>]*>/ /g'`). Don't render them or screenshot them.

The brand in brief:
- **Pink is action, never failure.**
- Measured values render in mono with **bracket notation**.
- **No spinners or skeleton shimmer.**
- **Motion** only where the doctrine allows it, never over 400ms, and reduced motion becomes a 90ms opacity change.

Implement the tokens as CSS custom properties and a Tailwind v4 `@theme` derived **from `tokens.js` and the T1 table**. Generate or derive them; don't hand-copy numbers. Add a test that pins the generated CSS against `tokens.js`, so drift fails loudly.

## 3. Hosts and routes (M0)

**`dialed.run`** (this repo; static, rebuilt nightly and on every push to `main`):

| route | page | notes |
| --- | --- | --- |
| `/` | M1 Home | |
| `/what-to-wear` | M2 index | only bands that have been published; hidden from nav until at least one exists |
| `/what-to-wear/{band}` | M3 guide | one page per published band; URL in °F (e.g. `32-41f`) |
| `/how-it-works` | M4 | legal-page layout, FAQ |
| `/invite` | M5 | request an invite / have a code |
| `/changelog`, `/changelog.xml` | M7 | Atom feed |
| `/privacy`, `/terms`, `/copyright`, `/open-source` | legal | rendered from the app repo's sources (§7) |

`www.dialed.run` returns a 301 to the apex.

**`app.dialed.run`** (not this repo): everything signed-in, plus `/login`, `/join?code=`, reset and confirm links, and `/feed/entry/{id}`. A signed-out visitor to an entry link sees only a landing page that reveals nothing of the entry. Links from this site into the app are absolute `https://app.dialed.run/...` URLs.

**Indexing.**
- One config flag, **`SITE_INDEXABLE`**, defaults to `false`.
- While it's `false`, every page sends `<meta name="robots" content="noindex">`, and `robots.txt` disallows everything. The app repo's decision D-53 keeps the whole site `noindex` until the public launch.
- At the public launch the owner flips it. From then on, `robots.txt` allows everything, a sitemap is published, and each page gets a canonical URL.

**Until the public launch the site is Home + Invite** (the board's own rule). Build How it works, Changelog and the legal pages anyway, but leave guides out of the nav until a band is published.

## 4. Pages

Build these from the board. The rules below are the ones that are easy to miss.

**M1 Home.** One promise, one proof, three steps, one ask.
- **The proof** is a real Call card, built as static markup filled at build time from the artifact's `callCard` (the owner's own published run). It's not a phone screenshot.
- **Both ways in sit together:** "Request an invite" (pink, the action) goes to `/invite`, and "Have a code?" (a link) goes to `https://app.dialed.run/join`.
- **The guide strip** appears only once a band has been published, and its count is the published total.
- **At 390px wide** the nav keeps only Log in.
- **Title:** "dialed.run · What to wear running, from your own runs". **Structured data:** WebApplication.

**M2 What to wear** (`/what-to-wear`).
- List published bands only, coldest first. An unpublished band is absent, not greyed out, and leaves no placeholder in the gap.
- **The whole tile is the link.** Each tile shows the band's most-dialed kit in one line, from the artifact, plus runs and runners.
- **The °F/°C switch** is a client-side preference that rewrites labels in place. URLs stay in °F, so there's one canonical page per band.

**M3 Guide** (`/what-to-wear/{band}`). This page answers searches like "what to wear running in 35 degrees".
- **The answer comes first,** in one generated sentence from the artifact. The evidence follows.
- **Sky sections** (Dry, Damp, Rain, Snow) each have a parts table showing worn garment types and dialed %, plus a "When it went wrong" line.
- **A sky section with fewer than 5 runners is absent,** and the jump links only list the sections that exist.
- **Garment rows show types, never brands.** Add prev/next band links, an invite card, and an optional "Reviewed at this temperature" card linking to biglongrun reviews (from the artifact; published pieces only).
- **Title:** "What to wear running at 32–41°F (0–5°C) · dialed.run". **Structured data:** FAQPage, built from the lead sentence plus one Q per sky.
- **At 390px:** the parts column folds into a group heading, and the invite card moves after the last sky section.

**M4 How it works.**
- **Layout:** the legal reading layout (the 620 measure, contents in a sticky column at desk width).
- **Content:** sections "The loop", "The verdict" (the five-step scale), "The call", and "Questions" (an FAQ with one- or two-sentence answers, marked up as FAQPage).
- **Pricing:** none until the owner decides on it. "Why invite-only?" needs the owner's confirmation.

**M5 Invite** (`/invite`).
- **The form:** one email field, plus Turnstile (managed, above the primary button). Every address gets the same "You're on the list" answer, whether it's new, already on the list, or already a runner.
- **"Have a code?"** has a code field and Join, which goes to `https://app.dialed.run/join?code=<code>`. The app validates it, so code errors live in one place.
- **Under the form:** links to the privacy policy and a "16 and over" line.
- **The sent page** links to the published band nearest today's feels-like temperature. Leave that link out if no band has been published.
- **OPEN: where the request goes.** The app already has request-access (Au5), but it's an in-app server function. M5 on this host needs one of:
  - (a) a small public, Turnstile-guarded endpoint on the app, that this page's form POSTs to before redirecting back to `/invite/sent`;
  - (b) "Request an invite" linking to the app's own request page.
  
  **Default:** build the page so the form POSTs to a configurable `INVITE_ENDPOINT`, and make the page work as plain HTML with no JavaScript. Until the app endpoint exists, show (b)'s link instead. List this as an app-side dependency.

**M6 Gear.** **Not in v1. Don't build it.**

**M7 Changelog.**
- **Content:** one Markdown file per entry (an Astro content collection), newest first. Each entry has a date, a headline, a tag (NEW, BETTER or FIXED), and a sentence or two on what changed **for the runner**.
- **Media:** an optional screenshot or short clip per entry.
- **FIXED entries** batch small items into one list.
- **Anchors:** each entry has a dated anchor (`/changelog#2026-10-03-typed-city`).
- **Tags:** `MONO.xs` ink in a 1px box, with no fill and no hue.
- **Feed:** `/changelog.xml` is an Atom feed with each entry's full text.
- **Title:** "Changelog · dialed.run". It's indexed (once `SITE_INDEXABLE` is on).
- **The app-side "What's new" row (M7b)** belongs to the app repo. It reads this feed.

**Chrome.** The nav has What to wear (only once a band is published), How it works, Log in, and Request an invite. The footer has Changelog · Privacy policy · Terms · Open source · Copyright · "Weather by Visual Crossing". Also build the Dark board's variant (a `prefers-color-scheme` theme from the T1 table).

## 5. Accessibility and performance

- Follow the Accessibility Contract: focus rings, 44px targets, and colour never the only signal.
- Ship zero client JS except the unit switch and Turnstile.
- Budget: a Lighthouse performance score ≥ 95 on Home and a guide page, and accessibility at 100 with no axe violations.
- Self-host the fonts with `font-display: swap`, and preload the two used above the fold.

## 6. Data: the nightly guide artifact

**This is an app-side dependency that isn't built yet.** A nightly cron in the app repo will compute guide data from **shared runs only**, enforce the privacy rule there, and write one JSON file to R2. This site's build reads it. Until it exists, build against a **fixture** in `src/data/fixtures/guide-artifact.json` that matches the contract below, and drive local builds and tests from it.

**The privacy rule** is enforced in the app; this site trusts it but still never renders a missing band:
- a band (or a sky section within one) must have **at least 5 distinct runners**, or it doesn't exist in the artifact at all;
- nothing in the artifact identifies a runner;
- the only identifying exception is the owner's own published Call card.

**Proposed contract v1.** Agree it with the app-side task, which will own the zod schema in the app repo, and validate the artifact with zod at build time. **A build fails on an unknown `version`.**

```jsonc
{
  "version": 1,
  "generatedAt": "2026-10-03T03:00:00Z",
  "totals": { "sharedRuns": 1240 },
  "bands": [
    {
      "slug": "32-41f",
      "label": { "f": "32–41°F", "c": "0–5°C" },
      "runs": 388, "runners": 46, "updated": "2026-10-03",
      "kitLine": "Long sleeve, tights, light gloves",
      "lead": "Most runners were dialed in a long sleeve, tights and light gloves. Shorts worked above 37°F feels-like when it was dry, and ran cold below it.",
      "skies": [
        {
          "sky": "dry", "runs": 241, "runners": 31,
          "parts": [
            { "part": "top", "types": [ { "type": "Long sleeve", "dialedPct": 74, "runs": 120 } ] }
          ],
          "wentWrong": [ { "type": "Shorts", "direction": "cold", "runs": 34, "of": 58 } ]
        }
      ],
      "reviews": [ { "name": "Example long sleeve", "dialedRuns": 8, "runs": 11, "url": "https://biglongrun.com/reviews/..." } ]
    }
  ],
  "callCard": {
    "when": "TOMORROW · 6:10 AM",
    "conditions": { "f": 38, "feelsF": 33, "sky": "damp" },
    "items": [ { "type": "Long sleeve, merino", "dialed": 7, "of": 9 } ],
    "note": "Last time it was this damp you wore the vest and ran a bit warm. Leave it."
  }
}
```

**OPEN: how the build reads the artifact.**
- **Default:** a public, read-only R2 URL, or a custom domain such as `data.dialed.run/guide-artifact.json`, fetched at build time. It carries only aggregates and is safe to make public.
- **Alternative:** read it with a CI secret.

Make the source configurable (`GUIDE_ARTIFACT_URL`), with the fixture as the fallback in local dev.

## 7. Legal pages and `/open-source`

**The app repo stays the source of truth.** The texts are `../dialed.run/docs/legal/{privacy-policy,terms,copyright}.md`, and each only goes live once its file starts with front matter `published: true`.
- **Fetching:** at build time, fetch them from the public app repo at a pinned ref, configurable (`LEGAL_SOURCE_REF`). Render **only** the files that carry the published marker; an unpublished text gives a 404 here too.
- **Layout:** the reading layout, which has a 620 measure, sticky contents at desk width, and "↑ Contents" or "Back to contents" per the boards.
- **Heading ids:** GitHub-compatible, including duplicate suffixes.
- **Parsing:** use a real parser (mdast or remark), and **fail the build on any unsupported node**. The app does the same; see its `account/legal-markdown.ts`.

**`/open-source`** lists every open-source package and asset that **this site** ships: npm dependencies, the fonts (OFL), and anything vendored. Generate it at build time and never hand-write it. It also lists the **app's** entries, from an artifact the app will publish; until that exists, link to `https://app.dialed.run/open-source`. Add a test that fails the build if a shipped package has a missing or unrecognised licence.

## 8. Changelog: Claude drafts, the owner approves

Add `docs/changelog-workflow.md` and a script or prompt for it. An agent:
1. Lists app-repo PRs merged since the newest entry's date, with `gh pr list --repo ddteeter/dialed.run --state merged --search "merged:>=YYYY-MM-DD"`.
2. Keeps only **runner-visible** changes, using each PR's "what a user sees" content and its demo.
3. Drafts entries in the board's voice: say what the runner can do now, not what we built. Use the tags NEW, BETTER and FIXED, batch small fixes, and never mention internals, lanes, PR numbers or tooling.
4. Opens a PR in this repo for the owner to approve.

Never auto-merge or auto-publish.

## 9. SEO

- **Titles:** per §4.
- **Descriptions:** one sentence per page.
- **Structured data:** JSON-LD for WebApplication, FAQPage and BreadcrumbList on guides.
- **Sitemap:** generated from published routes only.
- **Canonicals:** apex URLs only.
- **Open Graph:** one generic brand card. Pages never carry entry or runner data.
- **`llms.txt`:** optional; the blog has a pattern for it.

Everything is gated by `SITE_INDEXABLE` (§3).

## 10. Reference: the owner's blog (`../biglongrun.com`, read-only)

It's an Astro 7 site with Tailwind 4, `@astrojs/sitemap`, `@astrojs/rss` and MDX, deployed to Cloudflare. Reuse its **patterns**:
- JSON-LD helpers (`src/js/jsonLD.ts` and its tests);
- the sitemap and RSS setup;
- the build-mode and fixture approach (`src/js/buildMode.ts`, `USE_FIXTURE_DATA`);
- the unit preferences (°F/°C switch in `src/js/units/`);
- the snapshot tests;
- the analytics setup, if the owner wants analytics here (**OPEN**).

Don't reuse its styling: this site wears dialed.run's design system.

## 11. Quality gates

These are lighter than the app's gates, but real:
- **TypeScript and linting:** strict TS, ESLint and Prettier.
- **Unit tests** (Vitest) for every generator: the token derivation, the artifact schema and its fallbacks, the lead and kit-line rendering, the band and sky absence rules, heading ids, the legal published gate, the open-source licence check, and the changelog feed.
- **Playwright smoke and axe** on Home, Invite, How it works, Changelog and one guide page, built from the fixture.
- **Snapshot tests** of the generated HTML for one band, from the fixture.
- **A link check** across the built site.

There's no mutation ratchet.

**CI** (GitHub Actions):
- **On each PR:** build from the fixture, then run the tests and the link check.
- **On push to `main`:** build with the real artifact and deploy.
- **Nightly:** rebuild and deploy, which picks up fresh guide data.

## 12. Deployment

- **Hosting:** Cloudflare Workers with static assets (or Pages), configured in `wrangler.jsonc`, on the apex `dialed.run`.
- **Redirects:** `www` returns a 301 to the apex.
- **Account:** the same Cloudflare account as the app.
- **Secrets:** in CI only. Never write a secret, token or key into the repo.
- **Before the public launch:** `SITE_INDEXABLE=false`.

## 13. Phases

1. **Now, during the invite period:**
   - scaffold Astro, plus the token derivation and its test;
   - layout, nav, footer and the dark theme;
   - Home, with the Call card from the fixture;
   - Invite, using the link fallback until the app endpoint exists;
   - How it works;
   - Changelog and its feed, plus the drafting workflow;
   - the legal pages and `/open-source`;
   - `noindex` everywhere, CI, and deploy.
2. **At the public launch:**
   - the guides (M2/M3) against the real artifact, once bands publish;
   - flip `SITE_INDEXABLE`;
   - the sitemap.
3. **Later:**
   - Gear (M6);
   - the integrations from the Integration Opportunities board, which are mostly app-side.

## 14. App-side dependencies (built in `../dialed.run`, not here)

- The **two-host move** to `app.dialed.run`: `BETTER_AUTH_URL`, the OAuth redirect URIs and the Strava callback domain, cookies, email links and CSP. This is a deployment-sweep step.
- The **nightly guide-artifact cron**, writing to R2: it computes the aggregates, enforces the 5-runner rule, and publishes the contract in §6 as a zod schema.
- A **public request-access endpoint** for M5, if the owner picks option (a).
- An **open-source list artifact** from the app build.
- The **"What's new" row (M7b)**, which reads `/changelog.xml`.
- The **personal read API** for biglongrun (separate; designed in the app repo).

## 15. Open questions for the owner

1. M5: a public endpoint on the app (a), or a link to the app's request page (b)? The default is to build for (a), with (b) as the fallback.
2. Artifact access: a public aggregates URL, or a CI secret? The default is a public URL.
3. Analytics on this site: yes or no, and which provider?
4. The "Why invite-only?" FAQ answer and any pricing copy: the owner confirms these.
5. The logo, from `Logo Directions.dc.html`: which direction?
