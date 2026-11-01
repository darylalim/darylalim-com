import { Resvg } from "@resvg/resvg-js";
import { readFileSync } from "node:fs";
import satori from "satori";
import { formatDate, type Post } from "./posts";

/**
 * Per-post Open Graph cards (1200×630), rendered at build time: satori lays out the
 * card as SVG and resvg rasterizes it to PNG. Colors match the tokens in
 * src/styles/global.css and the look follows public/og-default.png.
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// satori reads TTF, OTF and WOFF, but not WOFF2; @fontsource ships WOFF too
const font = (weight: 400 | 600) =>
  readFileSync(
    `./node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-${weight}-normal.woff`,
  );
const fonts = [
  { name: "Plex Mono", data: font(400), weight: 400 as const },
  { name: "Plex Mono", data: font(600), weight: 600 as const },
];

const dark = {
  bg: "#121214",
  text: "#ececee",
  muted: "#a1a1a8",
  accent: "#4fd1c0",
};
const light = {
  bg: "#fdfdfc",
  text: "#1c1c1e",
  muted: "#5e5e63",
  accent: "#0d7068",
};

export const OG_VARIANTS = ["dark", "light", "description"] as const;
export type OgVariant = (typeof OG_VARIANTS)[number];

type Node = { type: string; props: Record<string, unknown> };
const el = (
  style: Record<string, unknown>,
  ...children: (Node | string)[]
): Node => ({
  type: "div",
  props: {
    style: { display: "flex", ...style },
    children: children.length === 1 ? children[0] : children,
  },
});

/** Long titles step down in size so they stay within three lines */
const titleSize = (title: string) =>
  title.length <= 32 ? 68 : title.length <= 56 ? 58 : 48;

function card(post: Post, variant: OgVariant): Node {
  const { title, description, pubDate, tags } = post.data;
  const c = variant === "light" ? light : dark;
  const withDescription = variant === "description";

  return el(
    {
      width: "100%",
      height: "100%",
      // satori sizes boxes content-box by default, so padding would push the
      // footer off the 630px canvas
      boxSizing: "border-box",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "72px 88px",
      background: c.bg,
      color: c.text,
      borderTop: `12px solid ${c.accent}`,
      fontFamily: "Plex Mono",
    },
    el(
      { fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em" },
      "daryl lim",
    ),
    el(
      { flexDirection: "column", gap: 24 },
      el(
        {
          fontSize: withDescription ? titleSize(title) - 6 : titleSize(title),
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          // Even line lengths, so a title never ends on one stranded word
          textWrap: "balance",
        },
        title,
      ),
      ...(withDescription
        ? [
            el(
              {
                fontSize: 26,
                lineHeight: 1.45,
                color: c.muted,
                // satori clamps with lineClamp only on block-level text
                display: "block",
                lineClamp: 2,
              },
              description,
            ),
          ]
        : []),
    ),
    el(
      {
        justifyContent: "space-between",
        gap: 32,
        fontSize: 26,
        color: c.muted,
      },
      el({}, `darylalim.com · ${formatDate(pubDate)}`),
      el({ color: c.accent }, tags.map((tag) => tag.toLowerCase()).join(" · ")),
    ),
  );
}

export async function renderOgImage(
  post: Post,
  variant: OgVariant = "dark",
): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori(card(post, variant) as never, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } })
    .render()
    .asPng();
  // resvg returns a Node Buffer, which Response's types reject; copy it out
  return new Uint8Array(png);
}
