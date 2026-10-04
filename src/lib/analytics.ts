/**
 * GoatCounter (the owner's choice, 2026-10-04): cookieless page counts,
 * with no personal data kept and no consent banner. The script is
 * GoatCounter's versioned count.v5.js, pinned by its published SRI hash, so
 * a changed file is refused rather than run. It loads only when
 * GOATCOUNTER_ENDPOINT is set, so fixture builds and tests never count.
 */
export const GOATCOUNTER_SCRIPT = "https://gc.zgo.at/count.v5.js";
export const GOATCOUNTER_INTEGRITY =
  "sha384-atnOLvQb9t+jTSipvd75X2yginT4PjVbqDdlJAmxMm+wYElFmeR6EmLP5bYeoRVQ";
