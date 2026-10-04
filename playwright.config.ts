import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke, axe and accessibility-contract checks against the built site,
 * served by `wrangler dev` so Cloudflare's own handling of _headers,
 * _redirects, trailing slashes and the 404 page is what's tested. Build
 * first: `npm run build:fixture`.
 */
const PORT = 8788;

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
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx wrangler dev --port ${String(PORT)} --ip 127.0.0.1 --log-level warn`,
    url: `http://localhost:${String(PORT)}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    env: { WRANGLER_SEND_METRICS: "false" },
    timeout: 60_000,
  },
});
