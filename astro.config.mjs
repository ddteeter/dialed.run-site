import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { cloudflareHeaders } from "./src/integrations/headers";
import { ossReport } from "./src/integrations/oss-report";

// https://astro.build/config
export default defineConfig({
  site: "https://dialed.run",
  output: "static",
  // One canonical URL per page, with no trailing slash: /how-it-works is
  // built as how-it-works.html, and wrangler.jsonc serves it without one.
  trailingSlash: "never",
  build: {
    format: "file",
    // External stylesheets only, so the CSP can say `style-src 'self'`.
    inlineStylesheets: "never",
  },
  integrations: [cloudflareHeaders(), ossReport()],
  vite: {
    plugins: [tailwindcss()],
    // Every package an emitted chunk holds, with its licence file's text
    // (app design 151). Not under .vite/, which Astro deletes; the
    // ossReport integration moves it out of dist/ before anything is
    // published, and scripts/open-source-list.ts reads it at postbuild.
    build: { license: { fileName: "oss-license.json" } },
    // Vite 8 no longer applies tsconfig `paths` to CSS `@import`, so the
    // alias is registered here as well.
    resolve: {
      alias: { "@/": `${fileURLToPath(new URL("./src", import.meta.url))}/` },
    },
  },
});
