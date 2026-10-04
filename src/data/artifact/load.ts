/**
 * Where the guide artifact comes from (HANDOFF §6, GUIDE_ARTIFACT_URL).
 *
 * - USE_FIXTURE_DATA=true: the committed fixture, for local dev and CI.
 * - Otherwise GUIDE_ARTIFACT_URL is required. A missing URL, a failed
 *   fetch or an invalid artifact fails the build. A production build never
 *   falls back to the fixture, so the site can't ship made-up numbers.
 */
import { env, type SiteEnv } from "@/config/env";
import fixture from "../fixtures/guide-artifact.json";
import { parseGuideArtifact, type GuideArtifact } from "./schema";

type Source = Pick<SiteEnv, "USE_FIXTURE_DATA" | "GUIDE_ARTIFACT_URL">;

export async function loadGuideArtifact(
  source: Source,
  fetchImpl: typeof fetch = fetch,
): Promise<GuideArtifact> {
  if (source.USE_FIXTURE_DATA) return parseGuideArtifact(fixture);

  const url = source.GUIDE_ARTIFACT_URL;
  if (url === undefined) {
    throw new Error(
      "GUIDE_ARTIFACT_URL is not set. Set it, or build with USE_FIXTURE_DATA=true for local work.",
    );
  }
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: "application/json" },
    });
  } catch (cause) {
    throw new Error(`Could not fetch the guide artifact from ${url}`, {
      cause,
    });
  }
  if (!response.ok) {
    throw new Error(
      `Could not fetch the guide artifact from ${url}: HTTP ${String(response.status)}`,
    );
  }
  return parseGuideArtifact(await response.json());
}

let cached: Promise<GuideArtifact> | undefined;

/** The artifact for this build, fetched once and shared by every page. */
export function getGuideArtifact(): Promise<GuideArtifact> {
  cached ??= loadGuideArtifact(env);
  return cached;
}
