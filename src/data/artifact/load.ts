/**
 * Where the guide artifact comes from (HANDOFF §6).
 *
 * - USE_FIXTURE_DATA=true: the committed fixture, for local dev and CI.
 * - GUIDE_ARTIFACT_FILE: a local copy. The deploy job downloads it from R2
 *   with a read-only key (the owner's choice, 2026-10-04; docs/deploy.md).
 * - GUIDE_ARTIFACT_URL: a public URL, if the artifact is ever made public.
 *
 * Outside fixture mode one of the two is required. A missing source, a
 * failed read or an invalid artifact fails the build. A production build
 * never falls back to the fixture, so the site can't ship made-up numbers.
 */
import { readFile } from "node:fs/promises";
import { env, type SiteEnv } from "@/config/env";
import fixture from "../fixtures/guide-artifact.json";
import { parseGuideArtifact, type GuideArtifact } from "./schema";

type Source = Pick<SiteEnv, "USE_FIXTURE_DATA" | "GUIDE_ARTIFACT_URL"> &
  Partial<Pick<SiteEnv, "GUIDE_ARTIFACT_FILE">>;

export async function loadGuideArtifact(
  source: Source,
  fetchImpl: typeof fetch = fetch,
): Promise<GuideArtifact> {
  if (source.USE_FIXTURE_DATA) return parseGuideArtifact(fixture);

  const file = source.GUIDE_ARTIFACT_FILE;
  if (file !== undefined) {
    let text: string;
    try {
      text = await readFile(file, "utf8");
    } catch (cause) {
      throw new Error(`Could not read the guide artifact at ${file}`, {
        cause,
      });
    }
    return parseGuideArtifact(JSON.parse(text));
  }

  const url = source.GUIDE_ARTIFACT_URL;
  if (url === undefined) {
    throw new Error(
      "No guide artifact: set GUIDE_ARTIFACT_FILE (or GUIDE_ARTIFACT_URL), or build with USE_FIXTURE_DATA=true for local work.",
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
