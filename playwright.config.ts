import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke, axe and accessibility-contract checks against the built site,
 * served by `wrangler dev` so Cloudflare's own handling of _headers,
 * _redirects, trailing slashes and the 404 page is what's tested. Build
 * first: `npm run build:fixture`.
 */
const PORT = 8788;

/**
 * Milliseconds of pacing per action, and the switch for recording at all.
 * 0 (the default, and what CI gets) is full speed and no video; `npm run
 * demo` sets it. As in the app repo's playwright.config.ts.
 */
const demoSlowMo = Number(process.env.DEMO_SLOWMO ?? 0);

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: "en-US",
    timezoneId: "America/Chicago",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: ["**/*.demo.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    // One journey, recorded only under DEMO_SLOWMO; otherwise it runs as
    // plain assertions alongside the rest.
    {
      name: "demo",
      testMatch: "**/*.demo.spec.ts",
      timeout: demoSlowMo > 0 ? 180_000 : 30_000,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        reducedMotion: "no-preference",
        // The captions are an injected <style>, which the site's own CSP
        // (style-src 'self') rightly refuses. Bypass it only while
        // recording: the unpaced run CI makes keeps the real policy, and the
        // smoke suite asserts there are no CSP errors.
        bypassCSP: demoSlowMo > 0,
        video:
          demoSlowMo > 0
            ? { mode: "on", size: { width: 1280, height: 720 } }
            : "off",
        launchOptions: { slowMo: demoSlowMo },
      },
    },
  ],
  webServer: {
    command: `npx wrangler dev --port ${String(PORT)} --ip 127.0.0.1 --log-level warn`,
    url: `http://localhost:${String(PORT)}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    env: { WRANGLER_SEND_METRICS: "false" },
    timeout: 60_000,
  },
});
