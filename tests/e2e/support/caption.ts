/**
 * The pure half of `scene()`: how long a caption holds, and the CSS that
 * paints it. Mirrors the app repo's e2e/support/caption.ts, and like it is
 * split out so Vitest can test it (test/caption.test.ts).
 */
const SCENE_MIN_MS = 1400;
const SCENE_PER_WORD_MS = 260;
const SCENE_MAX_MS = 4200;

/** ~230 words a minute, with a floor and a ceiling. */
export function holdFor(text: string): number {
  const words = text.trim().split(/\s+/u).length;
  return Math.min(
    Math.max(SCENE_MIN_MS, words * SCENE_PER_WORD_MS),
    SCENE_MAX_MS,
  );
}

/**
 * The whole caption, as one CSS rule. It's the `content` of `html::after`,
 * so it's painted without entering the document and no locator can match
 * it: a caption can never satisfy the assertion it narrates.
 *
 * Mono, uppercase, the cursor's pink: instrumentation laid over the site,
 * never product chrome. **Pinned to the bottom**, unlike the app's: this
 * site's nav is at the top, and the demo clicks it.
 */
export function captionRule(text: string): string {
  return `html::after {
    content: ${JSON.stringify(text)};
    position: fixed; inset: auto 0 0 0; z-index: 2147483646;
    pointer-events: none;
    background: rgba(12,12,12,0.92); color: #f5f5f0;
    font: 500 13px/1.4 "IBM Plex Mono", ui-monospace, monospace;
    letter-spacing: 0.09em; text-transform: uppercase;
    padding: 14px 20px; border-top: 2px solid rgba(255,45,135,0.9);
  }`;
}
