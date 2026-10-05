import { absolute } from "@/config/urls";

export interface HeadInput {
  title: string;
  /** One sentence. */
  description: string;
  /** The page's path, e.g. "/how-it-works". */
  path: string;
  /** The site-wide launch flag, SITE_INDEXABLE. */
  indexable: boolean;
  /** Keep this page out of search even after launch (e.g. /invite/sent). */
  noindex?: boolean;
}

export interface Head {
  title: string;
  description: string;
  robots: "noindex" | undefined;
  canonical: string | undefined;
  og: {
    type: "website";
    title: string;
    description: string;
    url: string;
    image: string;
  };
}

/**
 * A page's one public path. With file-format output Astro reports the
 * built file ("/how-it-works.html", "/index.html"); the site serves
 * "/how-it-works" and "/" (wrangler.jsonc, drop-trailing-slash).
 */
export function canonicalPath(path: string): string {
  const bare = path
    .replace(/\.html$/, "")
    .replace(/\/index$/, "/")
    .replace(/(.)\/$/, "$1");
  return bare === "" ? "/" : bare;
}

export function buildHead(input: HeadInput): Head {
  const indexed = input.indexable && input.noindex !== true;
  const url = absolute(canonicalPath(input.path));
  return {
    title: input.title,
    description: input.description,
    robots: indexed ? undefined : "noindex",
    canonical: indexed ? url : undefined,
    og: {
      type: "website",
      title: input.title,
      description: input.description,
      url,
      // One static brand card for every page (design round 31 #6).
      image: absolute("/og.png"),
    },
  };
}
