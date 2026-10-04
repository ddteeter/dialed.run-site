import { describe, expect, it } from "vitest";
import { DEFAULT_LEGAL_SOURCE_REF, readEnv } from "@/config/env";

describe("readEnv", () => {
  it("defaults to not indexable, the fixture off, and the app host", () => {
    const env = readEnv({});
    expect(env.SITE_INDEXABLE).toBe(false);
    expect(env.USE_FIXTURE_DATA).toBe(false);
    expect(env.APP_ORIGIN).toBe("https://app.dialed.run");
    expect(env.LEGAL_SOURCE_REF).toBe(DEFAULT_LEGAL_SOURCE_REF);
    expect(env.INVITE_ENDPOINT).toBeUndefined();
  });

  it("treats an empty variable as unset", () => {
    expect(
      readEnv({ SITE_INDEXABLE: "", GUIDE_ARTIFACT_URL: "" }),
    ).toMatchObject({
      SITE_INDEXABLE: false,
      GUIDE_ARTIFACT_URL: undefined,
    });
  });

  it("turns indexing on only for the literal true", () => {
    expect(readEnv({ SITE_INDEXABLE: "true" }).SITE_INDEXABLE).toBe(true);
    expect(readEnv({ SITE_INDEXABLE: "false" }).SITE_INDEXABLE).toBe(false);
  });

  it.each(["1", "yes", "TRUE", "on"])(
    "fails on a loose flag value %j instead of guessing",
    (value) => {
      expect(() => readEnv({ SITE_INDEXABLE: value })).toThrow(
        /SITE_INDEXABLE/,
      );
    },
  );

  it("needs a Turnstile site key whenever the invite endpoint is set", () => {
    expect(() =>
      readEnv({ INVITE_ENDPOINT: "https://app.dialed.run/api/request-access" }),
    ).toThrow(/TURNSTILE_SITE_KEY/);
  });

  it("rejects an app origin with a trailing slash", () => {
    expect(() => readEnv({ APP_ORIGIN: "https://app.dialed.run/" })).toThrow(
      /APP_ORIGIN/,
    );
  });
});
