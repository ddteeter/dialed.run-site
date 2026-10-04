/**
 * The published legal texts for this build. A text the app repo hasn't
 * marked `published: true` has no page here and no link to it (HANDOFF §7).
 */
import { env } from "@/config/env";
import type { LegalDoc } from "@/lib/legal/markdown";
import { loadLegalDocs, type LegalSlug } from "@/lib/legal/source";

export type { LegalSlug };

export const LEGAL_PAGES: readonly { slug: LegalSlug; label: string }[] = [
  { slug: "privacy", label: "Privacy policy" },
  { slug: "terms", label: "Terms" },
  { slug: "copyright", label: "Copyright" },
];

let cached: Promise<ReadonlyMap<LegalSlug, LegalDoc>> | undefined;

/** Fetched once per build and shared by every page. */
export function getLegalDocs(): Promise<ReadonlyMap<LegalSlug, LegalDoc>> {
  cached ??= loadLegalDocs(env);
  return cached;
}

export async function getPublishedLegalSlugs(): Promise<
  ReadonlySet<LegalSlug>
> {
  return new Set((await getLegalDocs()).keys());
}
