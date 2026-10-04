import { describe, expect, it } from "vitest";
import { buildHead } from "@/lib/head";
import { robotsTxt } from "@/lib/robots";
import { contentSecurityPolicy, headersFile } from "@/lib/headers";

const page = {
  title: "Changelog · dialed.run",
  description: "What's new in dialed.run, newest first.",
  path: "/changelog",
};

describe("buildHead", () => {
  it("sends noindex and no canonical while the site isn't indexable", () => {
    const head = buildHead({ ...page, indexable: false });
    expect(head.robots).toBe("noindex");
    expect(head.canonical).toBeUndefined();
  });

  it("drops noindex and adds an apex canonical once indexable", () => {
    const head = buildHead({ ...page, indexable: true });
    expect(head.robots).toBeUndefined();
    expect(head.canonical).toBe("https://dialed.run/changelog");
  });

  it("keeps a page that opts out noindexed after launch", () => {
    const head = buildHead({ ...page, indexable: true, noindex: true });
    expect(head.robots).toBe("noindex");
    expect(head.canonical).toBeUndefined();
  });
});

describe("robotsTxt", () => {
  it("disallows everything until launch", () => {
    expect(robotsTxt(false)).toBe("User-agent: *\nDisallow: /\n");
  });
  it("allows everything after launch", () => {
    expect(robotsTxt(true)).toBe("User-agent: *\nAllow: /\n");
  });
});

describe("headersFile", () => {
  const base = {
    appOrigin: "https://app.dialed.run",
    inviteEndpoint: undefined,
  };

  it("adds X-Robots-Tag: noindex only while not indexable", () => {
    expect(headersFile({ ...base, indexable: false })).toContain(
      "X-Robots-Tag: noindex",
    );
    expect(headersFile({ ...base, indexable: true })).not.toContain(
      "X-Robots-Tag",
    );
  });

  it("allows no third-party script without the invite endpoint", () => {
    const csp = contentSecurityPolicy({ ...base, indexable: false });
    expect(csp).toContain("script-src 'self';");
    expect(csp).toContain("frame-src 'none'");
    expect(csp).toContain("form-action 'self' https://app.dialed.run;");
  });

  it("allows Turnstile and the endpoint's origin when the form posts", () => {
    const csp = contentSecurityPolicy({
      ...base,
      indexable: false,
      inviteEndpoint: "https://app.dialed.run/api/request-access",
    });
    expect(csp).toContain(
      "script-src 'self' https://challenges.cloudflare.com;",
    );
    expect(csp).toContain("frame-src https://challenges.cloudflare.com;");
    expect(csp).toContain("form-action 'self' https://app.dialed.run;");
  });
});
