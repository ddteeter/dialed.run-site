import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

// https://astro.build/config
export default defineConfig({
  site: "https://dialed.run",
  output: "static",
  // One canonical URL per page, with no trailing slash: /how-it-works is
  // built as how-it-works.html, and wrangler.jsonc serves it without one.
  trailingSlash: "never",
  build: { format: "file" },
  vite: {
    // Vite 8 no longer applies tsconfig `paths` to CSS `@import`, so the
    // alias is registered here as well.
    resolve: {
      alias: { "@/": `${fileURLToPath(new URL("./src", import.meta.url))}/` },
    },
  },
});
