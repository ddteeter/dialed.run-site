/**
 * Renders the one static Open Graph card (design round 31 #6) to
 * public/og.png: a 600×315 layout rendered at 2×, 1200×630. It uses only
 * T1's dark column and the type steps, through the generated theme's own
 * variables. Run with `npm run og` after a theme or font change.
 */
import { readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { FONTS_OUTPUT, THEME_OUTPUT } from "../src/theme/sources.ts";

const root = new URL("../", import.meta.url);
// Fonts inline as data: URIs; a page made with setContent can't read file://.
const fontsCss = readFileSync(FONTS_OUTPUT, "utf8").replaceAll(
  /url\("\.\.\/\.\.\/design-reference\/fonts\/([^"]+)"\)/g,
  (_, file: string) =>
    `url("data:font/woff2;base64,${readFileSync(new URL(`design-reference/fonts/${file}`, root)).toString("base64")}")`,
);
// The theme's custom properties only; the Tailwind blocks need a compiler.
const theme = readFileSync(THEME_OUTPUT, "utf8");
const vars = theme.slice(0, theme.indexOf("@theme inline"));

const html = `<!doctype html>
<html data-ground="ink"><head><style>
${fontsCss}
${vars}
html, body { margin: 0; }
.card {
  box-sizing: border-box; width: 600px; height: 315px; padding: var(--space-8);
  background: var(--ground); color: var(--ink);
  display: flex; flex-direction: column; justify-content: space-between;
}
.wordmark { font: var(--type-title); letter-spacing: var(--track-title); }
.bracket { color: var(--action); }
.run { color: var(--muted); }
.foot { display: flex; align-items: flex-end; justify-content: space-between; gap: var(--space-6); }
.line { margin: 0; font: var(--type-display); letter-spacing: var(--track-display); text-transform: uppercase; }
.url { font: var(--mono-sm); letter-spacing: var(--track-mono-sm); text-transform: uppercase; color: var(--muted); }
</style></head>
<body><div class="card">
  <span class="wordmark"><span class="bracket">[</span>dialed<span class="run">.run</span><span class="bracket">]</span></span>
  <div class="foot"><p class="line">Wear what worked.</p><span class="url">dialed.run</span></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 600, height: 315 },
  deviceScaleFactor: 2,
});
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const out = new URL("public/og.png", root);
await page.screenshot({
  path: out.pathname,
  clip: { x: 0, y: 0, width: 600, height: 315 },
});
await browser.close();
console.log(`wrote ${out.pathname}`);
