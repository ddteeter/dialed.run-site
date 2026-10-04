/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

export default getViteConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["test/**/*.test.ts"],
          exclude: ["test/dist/**"],
        },
      },
      {
        // Reads the built site; run after `npm run build:fixture`.
        extends: true,
        test: { name: "dist", include: ["test/dist/**/*.test.ts"] },
      },
    ],
  },
});
