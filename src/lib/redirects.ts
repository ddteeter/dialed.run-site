/**
 * Cloudflare's `_redirects` for the static assets (design round 31 #5b):
 * app paths that used to live on this host, and links typed or bookmarked
 * the old way, 301 to the app with the path intact. Written into dist/ at
 * the end of the build (src/integrations/headers.ts). The query string
 * rides along (checked against `wrangler dev` in test/e2e/redirects.spec.ts).
 */
export const APP_PATHS = [
  "/feed",
  "/login",
  "/join",
  "/account",
  "/reset",
  "/confirm",
] as const;

export function redirectsFile(appOrigin: string): string {
  return `${APP_PATHS.flatMap((path) => [
    `${path} ${appOrigin}${path} 301`,
    `${path}/* ${appOrigin}${path}/:splat 301`,
  ]).join("\n")}\n`;
}
