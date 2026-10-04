import { describe, expect, it, vi } from "vitest";
import fixture from "@/data/fixtures/guide-artifact.json";
import { loadGuideArtifact } from "@/data/artifact/load";
import { parseGuideArtifact } from "@/data/artifact/schema";

const clone = () => structuredClone(fixture);

/** Narrows a fixture lookup, failing the test if the fixture changed shape. */
function at<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error("fixture is missing an expected entry");
  return value;
}

/** A deep path into a fixture clone, for one-field mutations. */
function mutate(edit: (artifact: typeof fixture) => void): unknown {
  const artifact = structuredClone(fixture);
  edit(artifact);
  return artifact;
}

describe("parseGuideArtifact", () => {
  it("accepts the fixture", () => {
    const artifact = parseGuideArtifact(fixture);
    expect(artifact.bands.map((b) => b.slug)).toEqual([
      "23-32f",
      "32-41f",
      "41-50f",
    ]);
    expect(artifact.callCard?.items).toHaveLength(3);
  });

  it.each([2, 0, "1", undefined])(
    "fails on version %j before anything else",
    (version) => {
      const artifact = { ...clone(), version };
      expect(() => parseGuideArtifact(artifact)).toThrow(
        /^Unknown guide artifact version .*: this build reads version 1$/,
      );
    },
  );

  it("fails on a band with fewer than 5 runners", () => {
    const artifact = mutate((a) => {
      at(a.bands[0]).runners = 4;
    });
    expect(() => parseGuideArtifact(artifact)).toThrow(
      /privacy: a band needs at least 5 runners/,
    );
  });

  it("fails on a sky section with fewer than 5 runners", () => {
    const artifact = mutate((a) => {
      at(at(a.bands[1]).skies[2]).runners = 4;
    });
    expect(() => parseGuideArtifact(artifact)).toThrow(
      /privacy: a sky section needs at least 5 runners/,
    );
  });

  it("fails on a key the contract doesn't name", () => {
    const artifact = mutate((a) => {
      Object.assign(a.callCard, { runner: "someone" });
    });
    expect(() => parseGuideArtifact(artifact)).toThrow(/Unrecognized key/);
  });

  it("fails on an unknown sky", () => {
    const artifact = mutate((a) => {
      Object.assign(at(at(a.bands[0]).skies[0]), { sky: "fog" });
    });
    expect(() => parseGuideArtifact(artifact)).toThrow(/sky/);
  });

  it("accepts an artifact with no Call card and no bands", () => {
    const artifact: Partial<typeof fixture> = { ...clone(), bands: [] };
    delete artifact.callCard;
    expect(parseGuideArtifact(artifact).callCard).toBeUndefined();
  });
});

describe("loadGuideArtifact", () => {
  it("reads the fixture when USE_FIXTURE_DATA is on, without fetching", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const artifact = await loadGuideArtifact(
      { USE_FIXTURE_DATA: true, GUIDE_ARTIFACT_URL: undefined },
      fetchImpl,
    );
    expect(artifact.totals.sharedRuns).toBe(1240);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("fails without a URL outside fixture mode", async () => {
    await expect(
      loadGuideArtifact({
        USE_FIXTURE_DATA: false,
        GUIDE_ARTIFACT_URL: undefined,
      }),
    ).rejects.toThrow(/GUIDE_ARTIFACT_URL is not set/);
  });

  const source = {
    USE_FIXTURE_DATA: false,
    GUIDE_ARTIFACT_URL: "https://data.dialed.run/guide-artifact.json",
  };

  it("fetches and parses the artifact from the URL", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json(fixture)),
    );
    const artifact = await loadGuideArtifact(source, fetchImpl);
    expect(artifact.bands).toHaveLength(3);
    expect(fetchImpl).toHaveBeenCalledWith(
      source.GUIDE_ARTIFACT_URL,
      expect.anything(),
    );
  });

  it("fails on an HTTP error instead of falling back to the fixture", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(new Response("nope", { status: 503 })),
    );
    await expect(loadGuideArtifact(source, fetchImpl)).rejects.toThrow(
      /HTTP 503/,
    );
  });

  it("fails on a network error", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.reject(new TypeError("offline")),
    );
    await expect(loadGuideArtifact(source, fetchImpl)).rejects.toThrow(
      /Could not fetch the guide artifact/,
    );
  });

  it("fails on an invalid artifact from the URL", async () => {
    const fetchImpl = vi.fn<typeof fetch>(() =>
      Promise.resolve(Response.json({ ...clone(), version: 2 })),
    );
    await expect(loadGuideArtifact(source, fetchImpl)).rejects.toThrow(
      /version 2/,
    );
  });
});
