import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { TAGS } from "@/lib/changelog/entries";

/** M7: one Markdown file per entry. See src/content/changelog/README.md. */
const changelog = defineCollection({
  loader: glob({ pattern: "[0-9]*.md", base: "./src/content/changelog" }),
  schema: ({ image }) =>
    z.strictObject({
      date: z.coerce.date(),
      headline: z.string().min(1),
      tag: z.enum(TAGS),
      media: z
        .discriminatedUnion("kind", [
          z.strictObject({
            kind: z.literal("image"),
            src: image(),
            alt: z.string().min(1),
          }),
          z.strictObject({
            kind: z.literal("video"),
            src: z.string().regex(/^\/changelog\/[\w.-]+\.(mp4|webm)$/),
            poster: z.string().regex(/^\/changelog\/[\w.-]+\.(jpg|png|webp)$/),
            alt: z.string().min(1),
          }),
        ])
        .optional(),
    }),
});

export const collections = { changelog };
