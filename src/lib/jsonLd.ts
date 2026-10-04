/**
 * JSON-LD, built as typed objects (schema-dts) and serialized with
 * JSON.stringify, never by string templating. `<` is escaped so no value can
 * close the script element it's embedded in.
 */
import type { FAQPage, Thing, WebApplication, WithContext } from "schema-dts";
import { SITE_ORIGIN } from "@/config/urls";

export function serializeJsonLd(node: WithContext<Thing>): string {
  return JSON.stringify(node).replaceAll("<", "\\u003c");
}

export function webApplication(
  description: string,
): WithContext<WebApplication> {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "dialed.run",
    url: SITE_ORIGIN,
    description,
    applicationCategory: "SportsApplication",
    operatingSystem: "Web",
  };
}

export interface Faq {
  question: string;
  answer: string;
}

export function faqPage(faqs: readonly Faq[]): WithContext<FAQPage> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
