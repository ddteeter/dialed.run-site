import { describe, expect, it } from "vitest";
import HaveACode from "@/components/HaveACode.astro";
import InviteRequest from "@/components/InviteRequest.astro";
import InvitePage from "@/pages/invite/index.astro";
import SentPage from "@/pages/invite/sent.astro";
import { parse, render } from "./render";

const linkMode = {
  endpoint: undefined,
  turnstileSiteKey: undefined,
  requestAccessUrl: "https://app.dialed.run/account/request-access",
  privacyPublished: false,
};
const formMode = {
  ...linkMode,
  endpoint: "https://app.dialed.run/api/request-access",
  turnstileSiteKey: "public-site-key",
};

describe("InviteRequest, until the app endpoint exists (option b)", async () => {
  const html = await render(InviteRequest, linkMode);
  const doc = parse(html);

  it("links the primary to the app's request page", () => {
    const link = doc.querySelector("a");
    expect(link?.textContent.trim()).toBe("Request an invite");
    expect(link?.getAttribute("href")).toBe(linkMode.requestAccessUrl);
  });

  it("has no form and no script", () => {
    expect(doc.querySelector("form")).toBeNull();
    expect(html).not.toContain("<script");
  });

  it("keeps the 16-and-over line", () => {
    expect(doc.body.textContent).toContain(
      "dialed.run is for runners 16 and over.",
    );
  });
});

describe("InviteRequest, once INVITE_ENDPOINT is set (option a)", async () => {
  const doc = parse(await render(InviteRequest, formMode));
  const form = doc.querySelector("form");

  it("POSTs one email field to the endpoint", () => {
    expect(form?.getAttribute("method")).toBe("post");
    expect(form?.getAttribute("action")).toBe(formMode.endpoint);
    const inputs = [...(form?.querySelectorAll("input") ?? [])];
    expect(
      inputs.map((input) => [
        input.getAttribute("name"),
        input.getAttribute("type"),
      ]),
    ).toEqual([["email", "email"]]);
  });

  it("gives the field a visible label", () => {
    expect(
      doc.querySelector('label[for="invite-email"]')?.textContent.trim(),
    ).toBe("Email");
  });

  it("puts managed Turnstile above the primary button", () => {
    const children = [...(form?.children ?? [])];
    const turnstile = children.findIndex((el) =>
      el.classList.contains("cf-turnstile"),
    );
    const button = children.findIndex((el) => el.tagName === "BUTTON");
    expect(turnstile).toBeGreaterThanOrEqual(0);
    expect(turnstile).toBeLessThan(button);
    expect(children[turnstile]?.getAttribute("data-sitekey")).toBe(
      "public-site-key",
    );
  });

  it("links the privacy policy only once it's published", async () => {
    expect(doc.querySelector('a[href="/privacy"]')).toBeNull();
    const published = parse(
      await render(InviteRequest, { ...formMode, privacyPublished: true }),
    );
    expect(published.querySelector('a[href="/privacy"]')?.textContent).toBe(
      "Privacy policy",
    );
  });
});

describe("HaveACode", async () => {
  const doc = parse(
    await render(HaveACode, { joinUrl: "https://app.dialed.run/join" }),
  );

  it("hands the code to the app's /join?code= with a plain GET", () => {
    const form = doc.querySelector("form");
    expect(form?.getAttribute("method")).toBe("get");
    expect(form?.getAttribute("action")).toBe("https://app.dialed.run/join");
    expect(form?.querySelector("input")?.getAttribute("name")).toBe("code");
  });
});

describe("invite pages", () => {
  it("/invite has one h1", async () => {
    const doc = parse(
      await render(InvitePage, {}, { url: "https://dialed.run/invite" }),
    );
    expect([...doc.querySelectorAll("h1")].map((h) => h.textContent)).toEqual([
      "Request an invite",
    ]);
  });

  it("/invite/sent answers the same for every address and stays out of search", async () => {
    const doc = parse(
      await render(SentPage, {}, { url: "https://dialed.run/invite/sent" }),
    );
    expect(doc.querySelector("h1")?.textContent).toBe("You're on the list");
    expect(
      doc.querySelector('meta[name="robots"]')?.getAttribute("content"),
    ).toBe("noindex");
    expect(doc.body.textContent).not.toMatch(/@/);
  });
});
