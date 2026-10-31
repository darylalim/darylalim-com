import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";
import { PROJECT_THEMES, type ProjectThemeId } from "./consts";

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

/** Featured projects, one Markdown file each; the body is an optional longer write-up. */
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    /** The card text: what it does, and why it's built that way */
    description: z.string(),
    theme: z.enum(
      PROJECT_THEMES.map((theme) => theme.id) as [
        ProjectThemeId,
        ...ProjectThemeId[],
      ],
    ),
    tech: z.array(z.string()).min(1),
    /** A live demo or site, if there is one */
    url: z.url().optional(),
    repo: z.url().optional(),
    featured: z.boolean().default(false),
    /** When the project started; orders projects within a theme, newest first */
    date: z.coerce.date(),
  }),
});

/** Blog posts. Drafts render in `astro dev` and are left out of every build (see src/lib/posts.ts). */
const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    /** Used for the meta description, the RSS summary and the blog index */
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog, experience, projects };
