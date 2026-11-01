// TEMPORARY: card variants for the comparison page. Remove before merging.
import type { APIRoute, GetStaticPaths } from "astro";
import { OG_VARIANTS, renderOgImage, type OgVariant } from "../../../lib/og";
import { getPosts, type Post } from "../../../lib/posts";

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return OG_VARIANTS.flatMap((variant) =>
    posts.map((post) => ({
      params: { variant, slug: post.id },
      props: { post, variant },
    })),
  );
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post; variant: OgVariant }> = async ({
  props,
}) =>
  new Response(await renderOgImage(props.post, props.variant), {
    headers: { "Content-Type": "image/png" },
  });
