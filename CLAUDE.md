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

Use `npm run preview`, not `astro dev`, to check anything that depends on how Cloudflare serves files: 404 handling, trailing-slash redirects, `_headers`, and the CSP (which is not active in `astro dev`).

## Conventions

- **Static only.** No adapter. Server features are out of scope; if one is needed later, add `@astrojs/cloudflare` and opt single routes into on-demand rendering.
- **Trailing slashes everywhere.** `trailingSlash: "always"` matches the directory build output and Workers' default `html_handling`. Write internal links as `/blog/`, never `/blog`.
- **No third-party requests.** Fonts and images are self-hosted.
- **Install scripts.** npm blocks dependency install scripts unless they are listed in `allowScripts` in `package.json` (`esbuild`, `fsevents`, `workerd` are approved by name). If `npm install` reports a newly skipped script, review it, then run `npm install-scripts approve <pkg> --no-allow-scripts-pin`.
- **Node** is pinned to the major version (`24`) in `.nvmrc`, which Workers Builds also reads; a major-only pin uses the version preinstalled in its build image instead of downloading one. Keep `engines` in `package.json` in step with it.
- Docs: https://docs.astro.build (routing, components, content collections, styling).

## Content

Content collections arrive in Phase 3 (`src/content.config.ts`, schemas in `PLAN.md`). Until then there is nothing to add.

<!-- Phase 3: replace this section with "how to add a post / project / resume entry". -->

## Git and deploys

- Work on a branch and merge to `main` through a PR. Never push straight to `main`.
- Workers Builds deploys `main` to production and builds every other branch as a preview; the preview URL is posted on the PR.
- Build command `npm run build`, deploy command `npx wrangler deploy`, preview command `npx wrangler preview` (the default). `wrangler preview` fails without the `previews` block in `wrangler.jsonc`; keep it, even empty. The Worker name in the dashboard must match `"name"` in `wrangler.jsonc` (`darylalim-com`).
- **Rollback:** `npx wrangler rollback` (pick the previous version), or the Worker's Deployments tab in the dashboard. Then fix forward with a PR.
