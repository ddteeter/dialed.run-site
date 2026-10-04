/**
 * The app's answers to a failed invite request (HANDOFF §4 M5): it
 * redirects to /invite?error=<code>. Copy comes from the boards: the
 * Turnstile band from round 27 #12, the rate-limit band from the Auth board,
 * and the email and note field messages from the app's own contract
 * (src/lib/contracts/garments.ts and access.ts in the app repo).
 */

/** The note's limit and where its counter appears (the app's ACCESS_NOTE_*). */
export const NOTE_MAX = 140;
export const NOTE_COUNT_FROM = 120;
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
    field: "invite-email",
    kicker: "Not sent",
    text: "That does not look like an email address.",
    status: "Not sent. One field needs a fix.",
  },
  invalid_note: {
    kind: "field",
    field: "invite-note",
    kicker: "Not sent",
    text: `Keep the note under ${String(NOTE_MAX)} characters.`,
    status: "Not sent. One field needs a fix.",
  },
} as const;

/** "120 / 140", the app's counter. */
export function noteCount(length: number): string {
  return `${String(length)} / ${String(NOTE_MAX)}`;
}

export type InviteErrorCode = keyof typeof INVITE_ERRORS;

export function inviteErrorCode(search: string): InviteErrorCode | undefined {
  const code = new URLSearchParams(search).get("error");
  return code !== null && Object.hasOwn(INVITE_ERRORS, code)
    ? (code as InviteErrorCode)
    : undefined;
}
