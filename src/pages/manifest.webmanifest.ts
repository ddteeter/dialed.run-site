import type { APIRoute } from "astro";
import { readFileSync } from "node:fs";
import { webManifest } from "@/lib/manifest";
import { T1_SOURCE } from "@/theme/sources";
import { parseT1 } from "@/theme/t1";

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      webManifest(parseT1(readFileSync(T1_SOURCE, "utf8"))),
      null,
      2,
    ),
    {
      headers: { "Content-Type": "application/manifest+json" },
    },
  );
