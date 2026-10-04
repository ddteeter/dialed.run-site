/**
 * Which legal texts are published. A text the app repo hasn't marked
 * `published: true` has no page here and no link to it (HANDOFF §7).
 */
export type LegalSlug = "privacy" | "terms" | "copyright";

export const LEGAL_PAGES: readonly { slug: LegalSlug; label: string }[] = [
  { slug: "privacy", label: "Privacy policy" },
  { slug: "terms", label: "Terms" },
  { slug: "copyright", label: "Copyright" },
];

/** Replaced by the real source when the legal pages land. */
export function getPublishedLegalSlugs(): Promise<ReadonlySet<LegalSlug>> {
  return Promise.resolve(new Set());
}
