/**
 * The nightly guide artifact, contract v1 (HANDOFF §6).
 *
 * The app computes it from shared runs only and enforces the privacy rule
 * before writing it. This site still checks: a band or sky section with
 * fewer than 5 runners, or any key the contract doesn't name, fails the
 * build. Either one means the app's side of the contract broke, and the
 * safe response is to publish nothing new rather than to guess.
 *
 * The app repo will own the canonical zod schema; keep this one in step
 * with it.
 */
import { z } from "zod";

export const SUPPORTED_VERSION = 1;
export const MIN_RUNNERS = 5;

const count = z.number().int().nonnegative();
const runners = (what: string) =>
  count.min(
    MIN_RUNNERS,
    `privacy: a ${what} needs at least ${String(MIN_RUNNERS)} runners`,
  );
const isoDate = z.iso.date();

export const skySchema = z.enum(["dry", "damp", "rain", "snow"]);

const typeShare = z.strictObject({
  type: z.string().min(1),
  dialedPct: z.number().min(0).max(100),
  runs: count,
});

const skySection = z.strictObject({
  sky: skySchema,
  runs: count,
  runners: runners("sky section"),
  parts: z.array(
    z.strictObject({ part: z.string().min(1), types: z.array(typeShare) }),
  ),
  wentWrong: z.array(
    z.strictObject({
      type: z.string().min(1),
      direction: z.enum(["cold", "warm"]),
      runs: count,
      of: count,
    }),
  ),
});

const band = z.strictObject({
  slug: z
    .string()
    .regex(/^-?\d+--?\d+f$/, "a band slug is a °F range like 32-41f"),
  label: z.strictObject({ f: z.string().min(1), c: z.string().min(1) }),
  runs: count,
  runners: runners("band"),
  updated: isoDate,
  kitLine: z.string().min(1),
  lead: z.string().min(1),
  skies: z.array(skySection),
  reviews: z.array(
    z.strictObject({
      name: z.string().min(1),
      dialedRuns: count,
      runs: count,
      url: z.url({ protocol: /^https$/ }),
    }),
  ),
});

export const callCardSchema = z.strictObject({
  when: z.string().min(1),
  conditions: z.strictObject({
    f: z.number(),
    feelsF: z.number(),
    sky: skySchema,
  }),
  items: z
    .array(
      z.strictObject({ type: z.string().min(1), dialed: count, of: count }),
    )
    .min(1),
  note: z.string().min(1),
});

export const guideArtifactSchema = z.strictObject({
  version: z.literal(SUPPORTED_VERSION),
  generatedAt: z.iso.datetime(),
  totals: z.strictObject({ sharedRuns: count }),
  bands: z.array(band),
  /** The owner's own published Call card: the one identifying exception. */
  callCard: callCardSchema.optional(),
});

export type GuideArtifact = z.infer<typeof guideArtifactSchema>;
export type Band = GuideArtifact["bands"][number];
export type CallCard = z.infer<typeof callCardSchema>;
export type Sky = z.infer<typeof skySchema>;

/**
 * Parses an artifact, failing first and plainly on a version this build
 * doesn't know, then on anything else the contract rejects.
 */
export function parseGuideArtifact(data: unknown): GuideArtifact {
  const version =
    typeof data === "object" && data !== null && "version" in data
      ? data.version
      : undefined;
  if (version !== SUPPORTED_VERSION) {
    throw new Error(
      `Unknown guide artifact version ${JSON.stringify(version)}: this build reads version ${String(SUPPORTED_VERSION)}`,
    );
  }
  const result = guideArtifactSchema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid guide artifact:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
