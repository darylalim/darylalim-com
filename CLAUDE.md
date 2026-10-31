# darylalim.com

Personal developer-portfolio site: a fully static Astro site served by Cloudflare Workers static assets. `PLAN.md` holds the decisions, phases and launch scope; check it before starting new work.

## Commands

| Command           | What it does                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`     | Astro dev server. For a long-running server use `npx astro dev --background`, then `astro dev stop / status / logs` |
| `npm run build`   | `astro check` (type check) then `astro build` into `dist/`                                                          |
| `npm run preview` | Build, then serve `dist/` in the real Workers runtime with `wrangler dev`                                           |
| `npm run deploy`  | Build and `wrangler deploy` (normally Workers Builds deploys instead; see below)                                    |
| `npm run format`  | Prettier (with `prettier-plugin-astro`); `PLAN.md` is excluded on purpose                                           |
| `npm run og`      | Re-render `public/og-default.png` from `scripts/og-default.html` with headless Chrome (macOS path)                  |

Use `npm run preview`, not `astro dev`, to check anything that depends on how Cloudflare serves files: 404 handling, trailing-slash redirects, `_headers`, and the CSP (which is not active in `astro dev`).

## Conventions

- **Static only.** No adapter. Server features are out of scope; if one is needed later, add `@astrojs/cloudflare` and opt single routes into on-demand rendering.
- **Trailing slashes everywhere.** `trailingSlash: "always"` matches the directory build output and Workers' default `html_handling`. Write internal links as `/blog/`, never `/blog`.
- **No third-party requests.** Fonts and images are self-hosted.
- **Install scripts.** npm blocks dependency install scripts unless they are listed in `allowScripts` in `package.json` (`esbuild`, `fsevents`, `workerd` are approved by name). If `npm install` reports a newly skipped script, review it, then run `npm install-scripts approve <pkg> --no-allow-scripts-pin`.
- **Node** is pinned to the major version (`24`) in `.nvmrc`, which Workers Builds also reads; a major-only pin uses the version preinstalled in its build image instead of downloading one. Keep `engines` in `package.json` in step with it.
- **Layout.** Every page uses `src/layouts/BaseLayout.astro` (SEO head, font preloads, header, `<main id="main">`, footer). Site name, description, nav and footer links live in `src/consts.ts`.
- **Design tokens.** Colors, type scale and spacing are custom properties in `src/styles/global.css`. Use the tokens, never hard-coded colors. Each color is a `light-dark()` pair, so dark mode and the theme toggle work without extra CSS. Any new text color must pass WCAG AA (4.5:1) on `--color-bg` and `--color-surface` in both themes; check it before using it.
- **Fonts.** IBM Plex Sans (body) and IBM Plex Mono (headings, nav, tags, dates) via `--font-sans` / `--font-mono`. Plex Mono only loads weights 400 and 600; use `--font-weight-bold` (600), or add a weight in `astro.config.mjs` first.
- **Code blocks.** Shiki config and its `fit-code-to-site` transformer are in `astro.config.mjs`; they apply to Markdown/MDX fences only, not the `<Code />` component.
- **Visual decisions.** Present choices (fonts, colors, layouts) as a temporary comparison page on a PR, so Daryl can choose on the preview URL; then remove the page in a follow-up commit.
- Docs: https://docs.astro.build (routing, components, content collections, styling).

## Content

Content collections arrive in Phase 3 (`src/content.config.ts`, schemas in `PLAN.md`). Until then there is nothing to add.

<!-- Phase 3: replace this section with "how to add a post / project / resume entry". -->

## Git and deploys

- Work on a branch and merge to `main` through a PR. Never push straight to `main`.
- Workers Builds deploys `main` to production and builds every other branch as a preview; the preview URL is posted on the PR.
- Build command `npm run build`, deploy command `npx wrangler deploy`, preview command `npx wrangler preview` (the default). `wrangler preview` fails without the `previews` block in `wrangler.jsonc`; keep it, even empty. The Worker name in the dashboard must match `"name"` in `wrangler.jsonc` (`darylalim-com`).
- Production: https://darylalim-com.daryl-a-lim.workers.dev (until the custom domain in Phase 5). Branch previews: `https://<branch-slug>-darylalim-com.daryl-a-lim.workers.dev`.
- Previews (open beta) return a plain `Not found` for unknown URLs instead of `404.html`; production is correct. Not a site bug.
- To test deployed URLs, use Node's `fetch`, not macOS's built-in `curl` (its LibreSSL fails the TLS handshake with `*.workers.dev`).
- **Rollback:** `npx wrangler rollback` (pick the previous version), or the Worker's Deployments tab in the dashboard. Then fix forward with a PR.
