import { defineCollection } from "astro:content";
import { file } from "astro/loaders";
import { z } from "astro/zod";

// Resume dates are months, not days: "2025-09"
const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM, e.g. 2025-09");

/** Resume entries, newest first in the file; the page sorts by `start` anyway. */
const experience = defineCollection({
  loader: file("src/content/experience.yaml"),
  schema: z
    .object({
      role: z.string(),
      org: z.string(),
      start: month,
      /** Omit for a current role */
      end: month.optional(),
      /** City or "Remote" only: never a street address */
      location: z.string().optional(),
      highlights: z.array(z.string()).min(1),
      /** Languages, frameworks and models, each backed by a public repo */
      skills: z.array(z.string()).optional(),
    })
    .refine((entry) => !entry.end || entry.end >= entry.start, {
      message: "`end` is before `start`",
      path: ["end"],
    }),
});

// blog and projects (glob loaders) join when their pages are built
export const collections = { experience };
