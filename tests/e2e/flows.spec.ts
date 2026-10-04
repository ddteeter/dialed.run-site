import { expect, test } from "./fixtures";

test("Have a code? hands the code to the app's /join?code=", async ({
  page,
  offsite,
}) => {
  await page.goto("/invite");
  await page.getByLabel("Have a code?").fill("DIAL-AB12");
  await page.getByRole("button", { name: "Join" }).click();
  await expect
    .poll(() => offsite)
    .toContain("https://app.dialed.run/join?code=DIAL-AB12");
});

test("Request an invite goes to the app's request page until the endpoint exists", async ({
  page,
}) => {
  await page.goto("/invite");
  await expect(
    page.getByRole("main").getByRole("link", { name: "Request an invite" }),
  ).toHaveAttribute("href", "https://app.dialed.run/account/request-access");
});

test("Home's two ways in", async ({ page }) => {
  await page.goto("/");
  const main = page.getByRole("main");
  await expect(
    main.getByRole("link", { name: "Request an invite" }),
  ).toHaveAttribute("href", "/invite");
  await expect(
    main.getByRole("link", { name: "Have a code? Join" }),
  ).toHaveAttribute("href", "https://app.dialed.run/join");
});

test.describe("Cloudflare routing", () => {
  test("an unknown path is a 404 with the 404 page", async ({ page }) => {
    const response = await page.goto("/nothing-here");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Nothing at this address",
    );
  });

  test("the changelog doesn't exist before its first entry", async ({
    page,
  }) => {
    expect((await page.goto("/changelog"))?.status()).toBe(404);
    expect((await page.goto("/changelog.xml"))?.status()).toBe(404);
  });

  test("an unpublished legal text is a 404", async ({ page }) => {
    expect((await page.goto("/terms"))?.status()).toBe(404);
  });

  for (const [from, to] of [
    ["/join?code=DIAL-AB12", "https://app.dialed.run/join?code=DIAL-AB12"],
    ["/feed/entry/42", "https://app.dialed.run/feed/entry/42"],
    ["/login", "https://app.dialed.run/login"],
    [
      "/account/export?format=json",
      "https://app.dialed.run/account/export?format=json",
    ],
  ] as const) {
    test(`${from} moves to the app, path and query intact`, async ({
      request,
    }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status()).toBe(301);
      expect(response.headers().location).toBe(to);
    });
  }

  for (const variant of ["/how-it-works/", "/how-it-works.html"]) {
    test(`${variant} redirects to the one canonical URL`, async ({
      request,
    }) => {
      const response = await request.get(variant, { maxRedirects: 0 });
      expect(response.status()).toBe(307);
      expect(
        new URL(String(response.headers().location), "http://x").pathname,
      ).toBe("/how-it-works");
    });
  }

  test("robots.txt disallows everything before launch", async ({ request }) => {
    expect(await (await request.get("/robots.txt")).text()).toBe(
      "User-agent: *\nDisallow: /\n",
    );
  });
});
