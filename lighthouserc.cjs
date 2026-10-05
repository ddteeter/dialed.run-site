/**
 * Lighthouse budgets (HANDOFF §5): performance ≥ 0.95, and accessibility,
 * best practices and SEO at 1.0, on the fixture build served by wrangler
 * dev. How it works joins at the public launch. Guide pages join with the guides. `is-crawlable` is skipped while
 * SITE_INDEXABLE is off: noindex everywhere is the point until launch.
 * A local server doesn't compress like Cloudflare does, so a local
 * performance score runs a few points under production.
 *
 * Run with `npm run lighthouse`, which runs a pinned @lhci/cli through npx
 * rather than adding its dependency tree (and its audit findings) to the
 * lockfile.
 */
const PORT = 8789;
const base = `http://localhost:${PORT}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `WRANGLER_SEND_METRICS=false npx wrangler dev --port ${PORT} --ip 127.0.0.1`,
      startServerReadyPattern: "Ready on",
      startServerReadyTimeout: 60000,
      url: [`${base}/`, `${base}/invite`, `${base}/privacy`],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        skipAudits: ["is-crawlable"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.95 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 1 }],
      },
    },
    upload: { target: "filesystem", outputDir: "lighthouse-report" },
  },
};
