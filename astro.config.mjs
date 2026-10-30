// @ts-check
import { defineConfig, fontProviders } from "astro/config";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// Fonts are loaded from the installed @fontsource packages (Latin subset only)
// and copied into the build, so visitors make no third-party requests.
// The npm provider would be simpler, but its fallback optimization fetch()es
// file:// URLs, which Node's fetch doesn't support.
const local = fontProviders.local();
const file = (/** @type {string} */ path) => `./node_modules/${path}`;

// https://astro.build/config
export default defineConfig({
  site: "https://darylalim.com",
  // Matches the directory-style build output and Workers' default html_handling
  trailingSlash: "always",
  integrations: [mdx(), sitemap()],
  // Temporary: both candidate families for the Phase 2 font comparison.
  // Remove the losing pair (config and package) once one is chosen.
  fonts: [
    {
      provider: local,
      name: "IBM Plex Sans",
      cssVariable: "--font-plex-sans",
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
      cssVariable: "--font-plex-mono",
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
    {
      provider: local,
      name: "Geist",
      cssVariable: "--font-geist-sans",
      options: {
        variants: [
          {
            weight: "100 900",
            style: "normal",
            src: [
              file(
                "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
              ),
            ],
          },
        ],
      },
    },
    {
      provider: local,
      name: "Geist Mono",
      cssVariable: "--font-geist-mono",
      fallbacks: ["monospace"],
      options: {
        variants: [
          {
            weight: "100 900",
            style: "normal",
            src: [
              file(
                "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
              ),
            ],
          },
        ],
      },
    },
  ],
});
