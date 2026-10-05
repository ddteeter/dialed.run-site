/**
 * The base test for `*.demo.spec.ts`, after the app repo's
 * e2e/support/demo.ts. It extends the shared fixture (every off-site
 * request is answered locally) and adds what a recording needs:
 *
 * - a synthetic cursor (dot and click ripple), so a click doesn't read as
 *   content changing for no visible reason;
 * - `goto` resolves only once the fonts have loaded, so a recording never
 *   opens on fallback-font frames;
 * - `scene()`, which captions and paces the recording.
 *
 * Pacing and video are opt-in through DEMO_SLOWMO (`npm run demo`). CI
 * runs the same journey at full speed, as assertions, with no video.
 */
import type { Page } from "@playwright/test";
import { captionRule, holdFor } from "./caption";
import { test as base } from "../fixtures";

const demoSlowMo = Number(process.env.DEMO_SLOWMO ?? 0);

/**
 * Caption the recording and hold a beat. This narrates; the `expect` beside
 * it proves. Inert without DEMO_SLOWMO.
 */
export async function scene(page: Page, text: string): Promise<void> {
  if (demoSlowMo === 0) return;
  await page.addStyleTag({ content: captionRule(text) });
  await page.waitForTimeout(holdFor(text));
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      const layer = "pointer-events:none;z-index:2147483647;position:fixed;";
      const pink = "255,45,135";
      let dot: HTMLDivElement | undefined;
      let targetX = -100;
      let targetY = -100;
      let x = -100;
      let y = -100;

      const track = (): void => {
        x += (targetX - x) * 0.3;
        y += (targetY - y) * 0.3;
        if (dot !== undefined)
          dot.style.transform = `translate(${String(x)}px, ${String(y)}px)`;
        requestAnimationFrame(track);
      };
      const ensureDot = (): void => {
        if (dot !== undefined) return;
        dot = document.createElement("div");
        dot.style.cssText = `${layer}left:-11px;top:-11px;width:22px;height:22px;border-radius:50%;background:rgba(${pink},0.25);border:2px solid rgba(${pink},0.9);`;
        document.documentElement.insertAdjacentElement("beforeend", dot);
        requestAnimationFrame(track);
      };
      const ripple = (clickX: number, clickY: number): void => {
        const ring = document.createElement("div");
        ring.style.cssText = `${layer}left:-11px;top:-11px;width:22px;height:22px;border-radius:50%;border:3px solid rgba(${pink},0.9);`;
        document.documentElement.insertAdjacentElement("beforeend", ring);
        const started = performance.now();
        const grow = (now: number): void => {
          const progress = Math.min((now - started) / 450, 1);
          ring.style.transform = `translate(${String(clickX)}px, ${String(clickY)}px) scale(${String(1 + progress * 1.6)})`;
          ring.style.opacity = String(1 - progress);
          if (progress < 1) requestAnimationFrame(grow);
          else ring.remove();
        };
        requestAnimationFrame(grow);
      };
      globalThis.addEventListener(
        "mousemove",
        (event) => {
          ensureDot();
          targetX = event.clientX;
          targetY = event.clientY;
        },
        { capture: true, passive: true },
      );
      globalThis.addEventListener(
        "mousedown",
        (event) => {
          ensureDot();
          ripple(event.clientX, event.clientY);
        },
        { capture: true, passive: true },
      );
    });

    const rawGoto = page.goto.bind(page);
    page.goto = async (...args: Parameters<Page["goto"]>) => {
      const response = await rawGoto(...args);
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      return response;
    };

    await use(page);
  },
});

export { expect } from "../fixtures";
