/** /changelog.xml, built only once there's an entry (design round 31 #5a). */
import type { APIRoute, GetStaticPaths } from "astro";
import { absolute, paths } from "@/config/urls";
import { getChangelogEntries } from "@/data/changelog";
import { atomFeed } from "@/lib/changelog/atom";

export const getStaticPaths = (async () =>
  (await getChangelogEntries()).length === 0
    ? []
    : [{ params: { feed: "changelog" } }]) satisfies GetStaticPaths;

export const GET: APIRoute = async () =>
  new Response(
    atomFeed({
      entries: await getChangelogEntries(),
      pageUrl: absolute(paths.changelog),
      feedUrl: absolute(paths.changelogFeed),
    }),
    { headers: { "Content-Type": "application/atom+xml; charset=utf-8" } },
  );
