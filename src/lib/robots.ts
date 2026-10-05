/** robots.txt: disallow everything until the public launch flag is on. */
export function robotsTxt(indexable: boolean): string {
  return indexable
    ? "User-agent: *\nAllow: /\n"
    : "User-agent: *\nDisallow: /\n";
}
