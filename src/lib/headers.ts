/**
 * Cloudflare's `_headers` file for the static assets, written into dist/
 * at the end of the build (src/integrations/headers.ts).
 *
 * While the site isn't indexable every response also carries
 * `X-Robots-Tag: noindex`, so a stray asset or a page that forgot its meta
 * tag still stays out of search.
 */
export interface HeadersInput {
  indexable: boolean;
  appOrigin: string;
  /** Set only when the invite form posts to the app (HANDOFF §4 M5 (a)). */
  inviteEndpoint: string | undefined;
}

const TURNSTILE_ORIGIN = "https://challenges.cloudflare.com";

export function contentSecurityPolicy(input: HeadersInput): string {
  const turnstile =
    input.inviteEndpoint === undefined ? [] : [TURNSTILE_ORIGIN];
  const formTargets = [
    "'self'",
    input.appOrigin,
    ...(input.inviteEndpoint === undefined
      ? []
      : [new URL(input.inviteEndpoint).origin]),
  ];
  const directives: [string, string[]][] = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", ...turnstile]],
    ["frame-src", turnstile.length > 0 ? turnstile : ["'none'"]],
    ["style-src", ["'self'"]],
    ["img-src", ["'self'", "data:"]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'"]],
    ["form-action", [...new Set(formTargets)]],
    ["base-uri", ["'none'"]],
    ["object-src", ["'none'"]],
    ["frame-ancestors", ["'none'"]],
  ];
  return directives
    .map(([name, values]) => `${name} ${values.join(" ")}`)
    .join("; ");
}

export function headersFile(input: HeadersInput): string {
  const lines = [
    "/*",
    `  Content-Security-Policy: ${contentSecurityPolicy(input)}`,
    "  X-Content-Type-Options: nosniff",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
  ];
  if (!input.indexable) lines.push("  X-Robots-Tag: noindex");
  return `${lines.join("\n")}\n`;
}
