import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import { getPosts } from "../lib/posts";

// Full posts, not just summaries, so the feed reads well in any reader.
// rendered.html is the post's HTML from the glob() loader (Markdown only;
// an .mdx post has no rendered field, so it falls back to the description).
export async function GET(context: APIContext) {
  const posts = await getPosts();
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    trailingSlash: true,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
      content: post.rendered?.html,
    })),
    customData: "<language>en</language>",
  });
}
