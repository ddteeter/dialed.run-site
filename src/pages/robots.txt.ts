import type { APIRoute } from "astro";
import { env } from "@/config/env";
import { robotsTxt } from "@/lib/robots";

export const GET: APIRoute = () =>
  new Response(robotsTxt(env.SITE_INDEXABLE), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
