/**
 * Every URL the site builds, in one place. Internal paths have no
 * trailing slash and no `.html` (see astro.config.mjs); links into the
 * app are absolute, on its own host.
 */
import { env } from "./env";

/** The apex. astro.config.mjs `site` must equal this (test/urls.test.ts). */
export const SITE_ORIGIN = "https://dialed.run";

export const paths = {
  home: "/",
  howItWorks: "/how-it-works",
  invite: "/invite",
  inviteSent: "/invite/sent",
  changelog: "/changelog",
  changelogFeed: "/changelog.xml",
  privacy: "/privacy",
  terms: "/terms",
  copyright: "/copyright",
  openSource: "/open-source",
} as const;

export function absolute(path: string): string {
  return new URL(path, SITE_ORIGIN).href.replace(/\/$/, "");
}

export function appUrl(path: string, origin: string = env.APP_ORIGIN): string {
  return `${origin}${path}`;
}

export const app = {
  login: appUrl("/login"),
  join: appUrl("/join"),
  requestAccess: appUrl("/account/request-access"),
  openSource: appUrl("/open-source"),
} as const;
