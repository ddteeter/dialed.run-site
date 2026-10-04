/**
 * The one `test` every spec imports (ESLint enforces it). Requests to any
 * host but the local server are answered here, never sent: the suite must
 * not depend on a third party answering, and navigations into the app are
 * recorded so a spec can assert where a link or form went.
 */
import { test as base, expect } from "@playwright/test";

export const PAGES = [
  "/",
  "/invite",
  "/invite/sent",
  "/how-it-works",
  "/privacy",
  "/open-source",
] as const;

interface Fixtures {
  /** URLs of off-site requests the page tried to make. */
  offsite: string[];
}

export const test = base.extend<Fixtures>({
  offsite: async ({ page, baseURL }, use) => {
    const offsite: string[] = [];
    await page.route("**/*", (route) => {
      const url = route.request().url();
      if (baseURL !== undefined && url.startsWith(baseURL))
        return route.continue();
      offsite.push(url);
      return route.fulfill({ status: 204, body: "" });
    });
    await use(offsite);
  },
});

export { expect };
