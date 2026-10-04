/**
 * The site's build-time configuration, read once from the environment.
 *
 * Every value here is public: it is either baked into the static HTML or
 * selects a public data source. Secrets never pass through this module
 * (the deploy token lives in CI only, and the build never needs it).
 *
 * Flags are strict. `SITE_INDEXABLE=yes` or `=1` fails the build rather
 * than being read as false, so a typo can't quietly leave the launch flag
 * off, and nothing but the literal `true` can turn it on.
 */
import { z } from "zod";

/** The app repo's `main` when this site was scaffolded. Bump deliberately. */
export const DEFAULT_LEGAL_SOURCE_REF =
  "1fb96e795314f5bf8d6c7e36a9d5035dc18044d4";

const unset = (value: unknown) => (value === "" ? undefined : value);

const flag = z.preprocess(
  unset,
  z
    .enum(["true", "false"], {
      error: (issue) =>
        `must be "true" or "false", got ${JSON.stringify(issue.input)}`,
    })
    .optional()
    .transform((value) => value === "true"),
);

const optionalUrl = z.preprocess(unset, z.url().optional());

export const envSchema = z
  .object({
    SITE_INDEXABLE: flag,
    USE_FIXTURE_DATA: flag,
    GUIDE_ARTIFACT_URL: optionalUrl,
    /** A local copy, downloaded from R2 by the deploy job (docs/deploy.md). */
    GUIDE_ARTIFACT_FILE: z.preprocess(unset, z.string().optional()),
    LEGAL_SOURCE_REF: z.preprocess(
      unset,
      z
        .string()
        .regex(/^[\w./-]+$/, "must be a git ref")
        .default(DEFAULT_LEGAL_SOURCE_REF),
    ),
    INVITE_ENDPOINT: optionalUrl,
    /** GoatCounter's count URL, e.g. https://dialedrun.goatcounter.com/count. Unset: no analytics. */
    GOATCOUNTER_ENDPOINT: z.preprocess(
      unset,
      z
        .url({ protocol: /^https$/ })
        .refine(
          (url) => url.endsWith("/count"),
          "must be a GoatCounter /count URL",
        )
        .optional(),
    ),
    TURNSTILE_SITE_KEY: z.preprocess(unset, z.string().optional()),
    APP_ORIGIN: z.preprocess(
      unset,
      z
        .url()
        .refine((url) => !url.endsWith("/"), "must not end with a slash")
        .default("https://app.dialed.run"),
    ),
  })
  .refine(
    (env) =>
      env.GUIDE_ARTIFACT_URL === undefined ||
      env.GUIDE_ARTIFACT_FILE === undefined,
    {
      message: "set GUIDE_ARTIFACT_FILE or GUIDE_ARTIFACT_URL, not both",
      path: ["GUIDE_ARTIFACT_FILE"],
    },
  )
  .refine(
    (env) =>
      env.INVITE_ENDPOINT === undefined || env.TURNSTILE_SITE_KEY !== undefined,
    {
      message: "INVITE_ENDPOINT needs TURNSTILE_SITE_KEY",
      path: ["TURNSTILE_SITE_KEY"],
    },
  );

export type SiteEnv = z.infer<typeof envSchema>;

export function readEnv(
  source: Record<string, string | undefined> = process.env,
): SiteEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `Invalid site configuration:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}

export const env: SiteEnv = readEnv();
