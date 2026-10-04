/**
 * Every internal href is already the URL the site serves: root-relative,
 * no trailing slash, no ".html". lychee (npm run linkcheck) can't see this
 * offline: it resolves /how-it-works/ to the file on disk without the 307
 * a server would answer with. Read off the live DOM, never by grepping
 * built HTML.
 */
import { expect, PAGES, test } from "./fixtures";

const CANONICAL =
  /^\/([a-z0-9-]+(\/[a-z0-9-]+)*(\.(xml|png|ico|svg|webmanifest))?)?(#[\w-]+)?$/;

for (const path of PAGES) {
  test(`${path}: internal links are canonical`, async ({ page, baseURL }) => {
    await page.goto(path);
    const hrefs = await page
      .locator("a[href], link[href]")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
    const internal = hrefs
      .filter(
        (href) =>
          !/^https?:\/\//.test(href) || href.startsWith(String(baseURL)),
      )
      .filter((href) => !href.startsWith("#") && !href.startsWith("/_astro/"));
    const offenders = internal.filter((href) => !CANONICAL.test(href));
    expect(offenders).toEqual([]);
  });

  test(`${path}: same-page anchors land on an element`, async ({ page }) => {
    await page.goto(path);
    const missing = await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links
          .map((a) =>
            decodeURIComponent((a.getAttribute("href") ?? "").slice(1)),
          )
          .filter((id) => id !== "" && document.getElementById(id) === null),
      );
    expect(missing).toEqual([]);
  });
}
