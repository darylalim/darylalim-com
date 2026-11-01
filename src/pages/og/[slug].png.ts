import type { APIRoute, GetStaticPaths } from "astro";
import { renderOgImage } from "../../lib/og";
import { getPosts, type Post } from "../../lib/posts";

// One card per published post, at /og/<slug>.png. getPosts() leaves drafts out of
// the build, so a draft never gets an image either.
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = async ({ props }) =>
  new Response(await renderOgImage(props.post), {
    headers: { "Content-Type": "image/png" },
  });
