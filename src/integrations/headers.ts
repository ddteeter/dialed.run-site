import { writeFile } from "node:fs/promises";
import type { AstroIntegration } from "astro";
import { env } from "../config/env";
import { headersFile } from "../lib/headers";

/** Writes dist/_headers for Cloudflare (see src/lib/headers.ts). */
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
      },
    },
  };
}
