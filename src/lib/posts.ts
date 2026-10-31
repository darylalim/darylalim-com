import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

/**
 * Published posts, newest first. Drafts are included only in `astro dev`, so a
 * draft never reaches production or a preview build (both run `astro build`).
 */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection(
    "blog",
    ({ data }) => import.meta.env.DEV || !data.draft,
  );
  // A post marked ready but still holding a writing note fails the build
  // instead of shipping. Drafts may hold as many as they like.
  for (const post of posts) {
    if (!post.data.draft && post.body?.includes("[TODO")) {
      throw new Error(
        `Blog post "${post.id}" still contains a [TODO] note but is not a draft.`,
      );
    }
  }
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

/** URL-safe tag: "On-device AI" → "on-device-ai" */
export const tagSlug = (tag: string) =>
  tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// UTC, so a date never shifts with the build machine's time zone
const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
export const formatDate = (date: Date) => dateFormat.format(date);

/** Minutes to read at 230 words a minute, never less than 1 */
export function readingTime(body = ""): number {
  const words = body
    // Code reads slower than prose and inflates the count; leave it out
    .replace(/```[\s\S]*?```/g, "")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
