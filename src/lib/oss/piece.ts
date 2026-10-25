/**
 * One row of `/open-source`: a package, a typeface, or a tool. The app's
 * `OpenSourcePiece` (src/modules/account/open-source-search.ts), which
 * `./licence-text` imports; kept here so that file stays a verbatim port.
 */
export interface OpenSourcePiece {
  readonly name: string;
  /** The licence's id; a tool's row prints it, a group's heading names the rest. */
  readonly licence?: string | undefined;
  /** The shipped version; a typeface has none on record. */
  readonly version?: string | undefined;
  /** Who holds the copyright, as its licence file says it; printed after ©. */
  readonly copyright?: string | undefined;
  readonly project?: string | undefined;
  /** An Apache NOTICE file, which the licence asks be passed on with it. */
  readonly notice?: string | undefined;
  /** Its own licence text, where it says something its group's does not. */
  readonly text?: string | undefined;
}
