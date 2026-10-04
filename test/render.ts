import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";
import { DOMParser } from "linkedom";

/**
 * Renders one component to HTML with the Container API.
 *
 * `component` is `unknown` because type-aware ESLint can't see through an
 * `.astro` import from a `.ts` file (it reads the default export as an
 * error type); `astro check` and tsc do type the import.
 */
export async function render(
  component: unknown,
  props: Record<string, unknown> = {},
  request?: { url: string },
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(component as AstroComponentFactory, {
    props,
    ...(request ? { request: new Request(request.url) } : {}),
  });
}

/** Parses rendered HTML so tests can query it instead of grepping. */
export function parse(html: string): Document {
  const doc = new DOMParser().parseFromString(
    `<!doctype html><html><body>${html}</body></html>`,
    "text/html",
  );
  return doc as unknown as Document;
}
