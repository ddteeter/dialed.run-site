import { expect, PAGES, test } from "./fixtures";

for (const width of [390, 1180]) {
  test.describe(`at ${String(width)}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const path of PAGES) {
      test(`${path}: every standalone target is at least 44×44`, async ({
        page,
      }) => {
        await page.goto(path);
        const small = await page
          .locator("a, button, input, select, textarea, summary")
          .evaluateAll((els) =>
            els.flatMap((el) => {
              const box = el.getBoundingClientRect();
              const style = getComputedStyle(el);
              // Hidden, or visually hidden until focused (the skip link).
              if (
                box.width <= 1 ||
                box.height <= 1 ||
                style.visibility === "hidden"
              )
                return [];
              // WCAG 2.5.8's inline exception: a link set in a sentence.
              const inSentence =
                el.tagName === "A" && style.display === "inline";
              if (inSentence) return [];
              return box.width < 44 || box.height < 44
                ? [
                    `${el.tagName} "${el.textContent.trim()}" ${String(Math.round(box.width))}×${String(Math.round(box.height))}`,
                  ]
                : [];
            }),
          );
        expect(small).toEqual([]);
      });

      test(`${path}: no element is disabled`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator("[disabled]")).toHaveCount(0);
      });
    }
  });
}

test.describe("at 390px", () => {
  test.use({ viewport: { width: 390, height: 900 } });

  test("the nav keeps only Log in", async ({ page }) => {
    await page.goto("/");
    const visible = await page
      .getByRole("navigation", { name: "Main" })
      .getByRole("link")
      .evaluateAll((links) =>
        links
          .filter((a) => a.getBoundingClientRect().width > 0)
          .map((a) => a.textContent.trim()),
      );
    expect(visible).toEqual(["Log in"]);
  });
});

test("the focus ring shows on a keyboard tab", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    return el === null ? "" : getComputedStyle(el).outlineStyle;
  });
  expect(outline).toBe("solid");
});
