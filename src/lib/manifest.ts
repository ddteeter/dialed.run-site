/**
 * The web app manifest (design round 31 #6, round 26 #22): the app's icons,
 * with theme and background colours from T1's dark ground, the ink tile.
 */
import type { T1Pair } from "@/theme/t1";

export function webManifest(pairs: readonly T1Pair[]): Record<string, unknown> {
  const ground = pairs.find((pair) => pair.token === "--ground");
  if (ground === undefined) throw new Error("T1 has no --ground row");
  return {
    name: "dialed.run",
    short_name: "dialed",
    description: "What to wear running, from your own runs.",
    start_url: "/",
    display: "browser",
    background_color: ground.dark,
    theme_color: ground.dark,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
