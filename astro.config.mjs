// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Fonts are loaded from the installed @fontsource packages (Latin subset only)
// and copied into the build, so visitors make no third-party requests.
// The npm provider would be simpler, but its fallback optimization fetch()es
// file:// URLs, which Node's fetch doesn't support.
const local = fontProviders.local();
const file = (/** @type {string} */ path) => `./node_modules/${path}`;

/**
 * Code blocks take their background from the site (--color-surface, in global.css)
 * instead of the theme, and github-light-default's comment gray (#6e7781, 4.09:1 on
 * that surface) is darkened to #59636e (5.50:1) to pass WCAG AA.
 * @type {import("shiki").ShikiTransformer}
 */
const fitCodeToSite = {
  name: "fit-code-to-site",
  pre(node) {
    const style = String(node.properties.style ?? "");
    node.properties.style = style.replace(/background-color:[^;]*;?/, "");
  },
  span(node) {
    const style = node.properties.style;
    if (typeof style === "string") {
      node.properties.style = style.replace(/#6e7781/gi, "#59636e");
    }
  },
};

const sha256 = (/** @type {string} */ text) =>
  /** @type {`sha256-${string}`} */ (
    `sha256-${createHash("sha256").update(text).digest("base64")}`
  );

/**
 * CSP hash of the is:inline theme script in BaseLayout.astro. Astro doesn't process
 * is:inline scripts, so it can't hash them; this reads the script from the source and
 * hashes it, so editing the script can never leave a stale hash behind. Only a tag at
 * the start of a line counts, so the text in a comment can't match.
 */
function themeScriptHash() {
  const layout = readFileSync("./src/layouts/BaseLayout.astro", "utf8");
  const matches = [
    ...layout.matchAll(/^[ \t]*<script is:inline>([\s\S]*?)<\/script>/gm),
  ];
  if (matches.length !== 1) {
    throw new Error(
      `Expected 1 is:inline script in BaseLayout.astro, found ${matches.length}`,
    );
  }
  return sha256(matches[0][1]);
}

const THEME_SCRIPT_HASH = themeScriptHash();

/**
 * Fails the build if the theme script in the built home page doesn't match the hash in
 * the CSP, e.g. if Astro ever stops emitting is:inline scripts byte for byte. Without
 * this, a mismatch only shows up as a CSP error in a visitor's console.
 * @type {import("astro").AstroIntegration}
 */
const checkThemeScriptHash = {
  name: "check-theme-script-hash",
  hooks: {
    "astro:build:done": ({ dir, logger }) => {
      const html = readFileSync(new URL("index.html", dir), "utf8");
      const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
      if (script === undefined || sha256(script) !== THEME_SCRIPT_HASH) {
        throw new Error(
          "The built theme script doesn't match its CSP hash in astro.config.mjs",
        );
      }
      logger.info(`theme script matches its CSP hash (${THEME_SCRIPT_HASH})`);
    },
  },
};

// https://astro.build/config
export default defineConfig({
  site: "https://darylalim.com",
  // Matches the directory-style build output and Workers' default html_handling
  trailingSlash: "always",
  integrations: [mdx(), sitemap(), checkThemeScriptHash],
  // Per-page <meta> CSP with hashes for the scripts and styles Astro processes.
  // Not active in `astro dev`: check it with `npm run preview`.
  // frame-ancestors is ignored in a <meta> CSP, so it is a header in public/_headers.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      // The is:inline theme script; Astro hashes every other script itself
      scriptDirective: { hashes: [THEME_SCRIPT_HASH] },
      styleDirective: {
        // Shiki writes inline style attributes, so allow those (style-src-attr) but not
        // inline <style> elements (style-src-elem: 'self' plus Astro's hashes)
        resources: [
          { resource: "'self'", kind: "element" },
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
      },
    },
  },
  markdown: {
    shikiConfig: {
      // Every token gets color: light-dark(<light>, <dark>), so code blocks follow
      // the same color-scheme switch as the rest of the site (and the theme toggle)
      themes: { light: "github-light-default", dark: "github-dark-default" },
      defaultColor: "light-dark()",
      transformers: [fitCodeToSite],
    },
  },
  // IBM Plex Sans + Mono, chosen in Phase 2 on a side-by-side comparison with Geist
  fonts: [
    {
      provider: local,
      name: "IBM Plex Sans",
      cssVariable: "--font-sans",
      options: {
        variants: [
          {
            weight: "100 700",
            style: "normal",
            src: [
              file(
                "@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2",
              ),
            ],
          },
        ],
      },
    },
    {
      provider: local,
      name: "IBM Plex Mono",
      cssVariable: "--font-mono",
      fallbacks: ["monospace"],
      options: {
        // Plex Mono has no variable version, so each weight is its own file
        variants: [
          {
            weight: 400,
            style: "normal",
            src: [
              file(
                "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
              ),
            ],
          },
          {
            weight: 600,
            style: "normal",
            src: [
              file(
                "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2",
              ),
            ],
          },
        ],
      },
    },
  ],
});
