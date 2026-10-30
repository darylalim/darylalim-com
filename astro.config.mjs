// @ts-check
import { defineConfig } from "astro/config";

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://darylalim.com",
  // Matches the directory-style build output and Workers' default html_handling
  trailingSlash: "always",
  integrations: [mdx(), sitemap()],
});
