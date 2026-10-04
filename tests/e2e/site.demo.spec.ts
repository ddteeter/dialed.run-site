/**
 * Covers: M1 Home (the promise, the Call card, the steps), M5 Invite (both
 * ways in), a published legal text in the reading layout, the 404, the
 * 390 layout and the dark theme. The invite-period site as a visitor meets
 * it. One journey, one video: record it with `npm run demo`.
 */
import { expect, scene, test } from "./support/demo";

test("the invite-period site: Home, the Call card, Invite, legal, 404, phone and dark", async ({
  page,
  offsite,
}) => {
  await page.goto("/");
  await scene(
    page,
    "Home at desk · one promise, one proof, three steps, one ask",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Wear what worked.",
  );

  await scene(
    page,
    "The proof · a real Call card, static markup from the nightly artifact",
  );
  const card = page.locator('[data-ground="ink"]');
  await expect(card).toContainText("38°F · FEELS 33° · DAMP");
  await expect(card).toContainText("Long sleeve, merino");
  await card.hover();

  await scene(page, "Three steps · log the run, say how it went, get the call");
  await page
    .getByRole("heading", { name: "Get the call" })
    .scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { level: 3 })).toHaveText([
    "Log the run",
    "Say how it went",
    "Get the call",
  ]);

  await scene(
    page,
    "Both ways in sit together · Request an invite is the action",
  );
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  const main = page.getByRole("main");
  await main.getByRole("link", { name: "Request an invite" }).click();
  await expect(page).toHaveURL(/\/invite$/u);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Request an invite",
  );

  await scene(
    page,
    "Until the app's endpoint ships, the request goes to the app's own page",
  );
  await expect(
    main.getByRole("link", { name: "Request an invite" }),
  ).toHaveAttribute("href", "https://app.dialed.run/account/request-access");

  await scene(
    page,
    "Have a code? · the app validates it, so errors live in one place",
  );
  await page.getByLabel("Have a code?").click();
  await page
    .getByLabel("Have a code?")
    .pressSequentially("DIAL-AB12", { delay: 90 });
  await page.getByRole("button", { name: "Join" }).click();
  await expect
    .poll(() => offsite)
    .toContain("https://app.dialed.run/join?code=DIAL-AB12");

  await page.goto("/privacy");
  await scene(
    page,
    "Legal texts render only once the app repo marks them published",
  );
  await expect(page.locator("#contents")).toBeVisible();
  await page
    .locator("#contents")
    .getByRole("link", { name: "Your choices" })
    .click();
  await expect(page).toHaveURL(/#your-choices$/u);

  const notFound = await page.goto("/nothing-here");
  await scene(
    page,
    "A wrong turn · the 404 offers a way on and no sales pitch",
  );
  expect(notFound?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Nothing at this address",
  );

  await page.setViewportSize({ width: 390, height: 720 });
  await page.goto("/");
  await scene(
    page,
    "At 390 · the nav keeps only Log in, and the card folds to one line",
  );
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Log in" })).toBeVisible();
  await expect(
    nav.getByRole("link", { name: "Request an invite" }),
  ).toBeHidden();
  await page.locator('[data-ground="ink"]').scrollIntoViewIfNeeded();

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await scene(
    page,
    "Dark follows the visitor's system · the card becomes panel and hairline",
  );
  await expect(page.locator("html")).toHaveCSS(
    "background-color",
    "rgb(11, 11, 14)",
  );
  await scene(page, "dialed.run · the invite-period site");
});
