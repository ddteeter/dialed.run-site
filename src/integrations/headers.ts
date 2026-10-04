import { writeFile } from "node:fs/promises";
import type { AstroIntegration } from "astro";
import { env } from "../config/env";
import { headersFile } from "../lib/headers";
import { redirectsFile } from "../lib/redirects";

/** Writes dist/_headers and dist/_redirects for Cloudflare (src/lib/headers.ts, redirects.ts). */
export function cloudflareHeaders(): AstroIntegration {
  return {
    name: "dialed:cloudflare-headers",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        const body = headersFile({
          indexable: env.SITE_INDEXABLE,
          appOrigin: env.APP_ORIGIN,
          inviteEndpoint: env.INVITE_ENDPOINT,
        });
        await writeFile(new URL("_headers", dir), body);
        await writeFile(
          new URL("_redirects", dir),
          redirectsFile(env.APP_ORIGIN),
        );
      },
    },
  };
}
