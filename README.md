# dialed.run-site

The marketing site for [dialed.run](https://dialed.run), built with Astro and deployed to Cloudflare. The app is a separate repo, served at `app.dialed.run`.

## Run it locally

Node 24 (see `.nvmrc`; Volta picks it up from `package.json`).

```sh
npm install
npm run dev            # http://localhost:4321, from the fixture data
npm run verify         # format, lint, type-check, unit tests, fixture build
```

`docs/HANDOFF.md` holds the decisions, page specs and data contract.
