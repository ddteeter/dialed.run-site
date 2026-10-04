import AxeBuilder from "@axe-core/playwright";
import { expect, PAGES, test } from "./fixtures";

const DESCRIPTION = { min: 50, max: 160 };

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const path of PAGES) {
      test(`${path} has no axe violations at WCAG 2.2 AA`, async ({
        page,
        offsite,
      }) => {
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        expect(
          results.violations.map(
            (v) =>
              `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
          ),
        ).toEqual([]);
        expect(offsite).toEqual([]);
      });
    }
  });
}

for (const path of PAGES) {
  test.describe(path, () => {
    test("loads, with one h1 and no skipped heading level", async ({
      page,
    }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      const levels = await page
        .locator("h1, h2, h3, h4, h5, h6")
        .evaluateAll((els) => els.map((el) => Number(el.tagName.slice(1))));
      expect(levels.filter((level) => level === 1)).toHaveLength(1);
      expect(levels[0]).toBe(1);
      levels.forEach((level, i) => {
        expect(level - (levels[i - 1] ?? 0)).toBeLessThanOrEqual(1);
      });
    });

    test("stays out of search while SITE_INDEXABLE is off", async ({
      page,
    }) => {
      const response = await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        "noindex",
      );
      expect(response?.headers()["x-robots-tag"]).toBe("noindex");
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    });

    test("has a one-sentence description and a title", async ({ page }) => {
      await page.goto(path);
      const description = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(description?.length).toBeGreaterThanOrEqual(DESCRIPTION.min);
      expect(description?.length).toBeLessThanOrEqual(DESCRIPTION.max);
      await expect(page).toHaveTitle(/dialed\.run/);
    });

    test("ships no script but JSON-LD, and every JSON-LD block parses", async ({
      page,
    }) => {
      await page.goto(path);
      const scripts = await page.locator("script").evaluateAll((els) =>
        els.map((el) => ({
          type: el.getAttribute("type"),
          text: el.textContent,
        })),
      );
      for (const script of scripts) {
        expect(script.type).toBe("application/ld+json");
        expect(() => JSON.parse(script.text) as unknown).not.toThrow();
      }
    });

    test("has nothing that animates", async ({ page }) => {
      await page.goto(path);
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(
        0,
      );
    });

    test("raises no console errors, CSP included", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.goto(path);
      expect(errors).toEqual([]);
    });
  });
}
