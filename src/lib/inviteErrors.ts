/**
 * The app's answers to a failed invite request (HANDOFF §4 M5): it
 * redirects to /invite?error=<code>. Copy comes from the boards: the
 * Turnstile band from round 27 #12, the rate-limit band from the Auth board,
 * and the email field message from the app's own contract.
 */
export const INVITE_ERRORS = {
  turnstile: {
    kind: "form",
    kicker: "Not sent",
    text: "We couldn't check this browser. Reload the page and try again.",
    status: "Not sent. We couldn't check this browser.",
  },
  rate_limited: {
    kind: "form",
    kicker: "Not sent",
    text: "Too many tries. Wait a minute, then try again.",
    status: "Not sent. Too many tries.",
  },
  invalid_email: {
    kind: "field",
    kicker: "Not sent",
    text: "That does not look like an email address.",
    status: "Not sent. One field needs a fix.",
  },
} as const;

export type InviteErrorCode = keyof typeof INVITE_ERRORS;

export function inviteErrorCode(search: string): InviteErrorCode | undefined {
  const code = new URLSearchParams(search).get("error");
  return code !== null && Object.hasOwn(INVITE_ERRORS, code)
    ? (code as InviteErrorCode)
    : undefined;
}
