/**
 * Lets plain `tsc` type a test's `.astro` import. Astro's own checker
 * (`astro check`) reads the component itself; this is only the fallback
 * for tools that can't parse `.astro` files.
 */
declare module "*.astro" {
  const Component: import("astro/runtime/server/index.js").AstroComponentFactory;
  export default Component;
}
