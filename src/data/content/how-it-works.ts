/**
 * M4's questions, from the Marketing Site board as updated in design
 * round 32. One array feeds both the page and its FAQPage JSON-LD, so the
 * two can't disagree. "Why invite-only?" awaits the owner's confirmation
 * (HANDOFF §15).
 */
import type { Faq } from "@/lib/jsonLd";

export const FAQS: readonly Faq[] = [
  {
    question: "Do I need Strava?",
    answer:
      "No. Strava saves you a step. You can also upload a GPX or FIT file from any watch.",
  },
  {
    question: "Where does the weather come from?",
    answer:
      "Visual Crossing, for the time and place your run started. You never type it.",
  },
  {
    question: "Who sees my runs?",
    answer:
      "Only you, unless you share it with runners on dialed.run. Either way, its kit and verdict can count in the guides, added up with other runners' and never with your name.",
  },
  {
    question: "Can I keep my runs out of the guides?",
    answer:
      "Yes. In Settings, turn off Count my runs in anonymous totals. Your runs leave the guides at the next nightly update.",
  },
  {
    question: "Why invite-only?",
    answer:
      "So we can answer everyone who writes in. Request an invite and we'll send a code.",
  },
];
