/**
 * The legal texts, from the app repo (HANDOFF §7). The app repo is the
 * source of truth: its docs/legal/{privacy-policy,terms,copyright}.md, at
 * the pinned LEGAL_SOURCE_REF. Fixture builds read src/data/fixtures/legal.
 *
 * A text without the owner's published mark has no page here. A published
 * text fails the build if it can't be drawn (an unsupported construct),
 * still holds an `[OWNER:` note, or links to a legal page that isn't
 * published, since that link would 404.
 */
import type { SiteEnv } from "@/config/env";
import {
  parseLegalDoc,
  publishedText,
  type Block,
  type Inline,
  type LegalDoc,
} from "./markdown";

export type LegalSlug = "privacy" | "terms" | "copyright";

export const LEGAL_FILES: Record<LegalSlug, string> = {
  privacy: "privacy-policy.md",
  terms: "terms.md",
  copyright: "copyright.md",
};

const LEGAL_PATHS = new Map<string, LegalSlug>([
  ["/privacy", "privacy"],
  ["/terms", "terms"],
  ["/copyright", "copyright"],
]);

const fixtures = import.meta.glob<string>("../../data/fixtures/legal/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

export function legalSourceUrl(ref: string, file: string): string {
  return `https://raw.githubusercontent.com/ddteeter/dialed.run/${ref}/docs/legal/${file}`;
}

type Source = Pick<SiteEnv, "USE_FIXTURE_DATA" | "LEGAL_SOURCE_REF">;

async function readRaw(
  source: Source,
  file: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  if (source.USE_FIXTURE_DATA) {
    const text = fixtures[`../../data/fixtures/legal/${file}`];
    if (text === undefined) throw new Error(`no fixture legal text ${file}`);
    return text;
  }
  const url = legalSourceUrl(source.LEGAL_SOURCE_REF, file);
  let response: Response;
  try {
    response = await fetchImpl(url);
  } catch (cause) {
    throw new Error(`Could not fetch ${url}`, { cause });
  }
  if (!response.ok) {
    throw new Error(`Could not fetch ${url}: HTTP ${String(response.status)}`);
  }
  return response.text();
}

function links(inlines: readonly Inline[]): string[] {
  return inlines.flatMap((inline) => {
    if (inline.kind === "link") return [inline.href, ...links(inline.children)];
    if (inline.kind === "strong") return links(inline.children);
    return [];
  });
}

function blockLinks(block: Block): string[] {
  switch (block.kind) {
    case "list":
    case "numbered":
      return block.items.flatMap(links);
    case "table":
      return [...block.head, ...block.rows.flat()].flatMap(links);
    default:
      return links(block.inlines);
  }
}

/** Throws if a published text would ship broken or unfinished. */
export function checkPublished(
  slug: LegalSlug,
  text: string,
  doc: LegalDoc,
  published: ReadonlySet<LegalSlug>,
): void {
  if (text.includes("[OWNER:")) {
    throw new Error(
      `${LEGAL_FILES[slug]} is marked published but still has an [OWNER: …] note`,
    );
  }
  for (const href of doc.blocks.flatMap(blockLinks)) {
    const target = LEGAL_PATHS.get(href);
    if (target !== undefined && !published.has(target)) {
      throw new Error(
        `${LEGAL_FILES[slug]} links to ${href}, but ${LEGAL_FILES[target]} isn't published`,
      );
    }
    if (
      href.startsWith("#") &&
      !doc.contents.some(({ id }) => `#${id}` === href)
    ) {
      throw new Error(
        `${LEGAL_FILES[slug]} links to ${href}, which isn't one of its sections`,
      );
    }
  }
}

export async function loadLegalDocs(
  source: Source,
  fetchImpl: typeof fetch = fetch,
): Promise<ReadonlyMap<LegalSlug, LegalDoc>> {
  const texts = new Map<LegalSlug, string>();
  for (const [slug, file] of Object.entries(LEGAL_FILES) as [
    LegalSlug,
    string,
  ][]) {
    const text = publishedText(await readRaw(source, file, fetchImpl));
    if (text !== undefined) texts.set(slug, text);
  }
  const published = new Set(texts.keys());
  const docs = new Map<LegalSlug, LegalDoc>();
  for (const [slug, text] of texts) {
    let doc: LegalDoc;
    try {
      doc = parseLegalDoc(text);
    } catch (cause) {
      throw new Error(`${LEGAL_FILES[slug]} can't be drawn`, { cause });
    }
    checkPublished(slug, text, doc, published);
    docs.set(slug, doc);
  }
  return docs;
}
