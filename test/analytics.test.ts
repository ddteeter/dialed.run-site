import { describe, expect, it } from "vitest";
import Analytics from "@/components/Analytics.astro";
import { readEnv } from "@/config/env";
import { GOATCOUNTER_INTEGRITY, GOATCOUNTER_SCRIPT } from "@/lib/analytics";
import { contentSecurityPolicy } from "@/lib/headers";
import { parse, render } from "./render";

const ENDPOINT = "https://dialedrun.goatcounter.com/count";

describe("GoatCounter", () => {
  it("adds nothing when GOATCOUNTER_ENDPOINT is unset", async () => {
    expect(await render(Analytics, { endpoint: undefined })).not.toContain(
      "<script",
    );
  });

  it("loads the pinned v5 script with its integrity hash", async () => {
    const script = parse(
      await render(Analytics, { endpoint: ENDPOINT }),
    ).querySelector("script");
    expect(script?.getAttribute("src")).toBe(GOATCOUNTER_SCRIPT);
    expect(script?.getAttribute("integrity")).toBe(GOATCOUNTER_INTEGRITY);
    expect(script?.getAttribute("crossorigin")).toBe("anonymous");
    expect(script?.getAttribute("data-goatcounter")).toBe(ENDPOINT);
  });

  it("accepts only an https GoatCounter /count URL", () => {
    expect(
      readEnv({ GOATCOUNTER_ENDPOINT: ENDPOINT }).GOATCOUNTER_ENDPOINT,
    ).toBe(ENDPOINT);
    expect(() =>
      readEnv({ GOATCOUNTER_ENDPOINT: "https://dialedrun.goatcounter.com" }),
    ).toThrow(/GOATCOUNTER_ENDPOINT/);
    expect(() =>
      readEnv({
        GOATCOUNTER_ENDPOINT: "http://dialedrun.goatcounter.com/count",
      }),
    ).toThrow(/GOATCOUNTER_ENDPOINT/);
  });

  it("opens the CSP to GoatCounter's two hosts only when it's on", () => {
    const base = {
      indexable: false,
      appOrigin: "https://app.dialed.run",
      inviteEndpoint: undefined,
    };
    const off = contentSecurityPolicy(base);
    expect(off).not.toContain("goatcounter");
    expect(off).not.toContain("gc.zgo.at");
    const on = contentSecurityPolicy({
      ...base,
      goatcounterEndpoint: ENDPOINT,
    });
    expect(on).toContain("script-src 'self' https://gc.zgo.at;");
    expect(on).toContain(
      "connect-src 'self' https://dialedrun.goatcounter.com;",
    );
    expect(on).toContain(
      "img-src 'self' data: https://dialedrun.goatcounter.com;",
    );
  });
});
