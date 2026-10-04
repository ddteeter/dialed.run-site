import { describe, expect, it } from "vitest";
import HaveACode from "@/components/HaveACode.astro";
import InviteRequest from "@/components/InviteRequest.astro";
import InvitePage from "@/pages/invite/index.astro";
import SentPage from "@/pages/invite/sent.astro";
import { INVITE_ERRORS, inviteErrorCode, noteCount } from "@/lib/inviteErrors";
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

  it("POSTs the email and the optional note to the endpoint", () => {
    expect(form?.getAttribute("method")).toBe("post");
    expect(form?.getAttribute("action")).toBe(formMode.endpoint);
    const inputs = [...(form?.querySelectorAll("input") ?? [])];
    expect(
      inputs.map((input) => [
        input.getAttribute("name"),
        input.getAttribute("type"),
      ]),
    ).toEqual([
      ["email", "email"],
      ["note", "text"],
    ]);
  });

  it("keeps the note optional, one line, and within the app's 140 characters", () => {
    const note = doc.getElementById("invite-note");
    expect(note?.hasAttribute("required")).toBe(false);
    expect(note?.getAttribute("maxlength")).toBe("140");
    expect(
      doc.querySelector('label[for="invite-note"]')?.textContent.trim(),
    ).toBe("Note · optional");
    expect(doc.getElementById("invite-note-hint")?.textContent.trim()).toBe(
      "Where you run, or who sent you. One line.",
    );
    expect(note?.getAttribute("aria-describedby")).toBe(
      "invite-note-hint invite-note-count",
    );
    expect(
      doc.getElementById("invite-note-count")?.hasAttribute("hidden"),
    ).toBe(true);
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

describe("failures the app redirects back with", () => {
  it.each([
    ["?error=turnstile", "turnstile"],
    ["?error=rate_limited", "rate_limited"],
    ["?error=invalid_email", "invalid_email"],
    ["?error=invalid_note", "invalid_note"],
    ["?error=nope", undefined],
    ["?error=toString", undefined],
    ["", undefined],
  ])("reads %j as %j", (search, code) => {
    expect(inviteErrorCode(search)).toBe(code);
  });

  it("counts the note as the app does", () => {
    expect(noteCount(120)).toBe("120 / 140");
    expect(INVITE_ERRORS.invalid_note.text).toBe(
      "Keep the note under 140 characters.",
    );
  });

  it("uses the boards' copy", () => {
    expect(INVITE_ERRORS.rate_limited.text).toBe(
      "Too many tries. Wait a minute, then try again.",
    );
    expect(INVITE_ERRORS.turnstile.text).toBe(
      "We couldn't check this browser. Reload the page and try again.",
    );
  });

  it("puts the rate-limit band above the button and the Turnstile band under it, hidden until needed", async () => {
    const doc = parse(await render(InviteRequest, formMode));
    const form = doc.querySelector("form");
    const order = [
      ...(form?.querySelectorAll("[data-invite-error], button") ?? []),
    ].map((el) => el.getAttribute("data-invite-error") ?? el.tagName);
    expect(order).toEqual(["rate_limited", "BUTTON", "turnstile"]);
    for (const band of form?.querySelectorAll("[data-invite-error]") ?? []) {
      expect(band.hasAttribute("hidden")).toBe(true);
    }
    expect(doc.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(
      doc.getElementById("invite-email-error")?.hasAttribute("hidden"),
    ).toBe(true);
  });
});
