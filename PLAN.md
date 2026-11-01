# darylalim.com — Build Plan

A personal developer-portfolio site built with **Astro** as a fully static site, deployed to **Cloudflare Workers (static assets)** on the custom domain **darylalim.com**.

## Decisions

| Area | Choice | Why |
| --- | --- | --- |
| Framework | Astro (latest, TypeScript strict) | Content-first, ships zero JS by default |
| Rendering | Fully static (no adapter) | Fastest and cheapest; static asset requests on Workers are free |
| Hosting | Cloudflare Workers static assets | Cloudflare's recommended target for new projects; the Astro adapter dropped Pages support (v13+) |
| Deploys | Workers Builds connected to GitHub | Push to `main` deploys; PRs get preview URLs |
| Content | Content collections (Markdown/MDX + YAML) | Typed frontmatter; new post = new file |
| Design | Developer-portfolio | Monospace accents, project cards, good code styling |
| Accent | Teal (`#0d7068` / `#4fd1c0`) | Chosen on a comparison page (PR #11); passes WCAG AA in both themes |
| Fonts | IBM Plex Sans + IBM Plex Mono, self-hosted | Chosen over Geist on a comparison page (PR #7): more distinctive mono for headings, warmer body text, not the default Vercel/Next.js look |
| Sections | Home/About, Blog, Projects, Resume/CV | — |
| Email | `hello@darylalim.com` via Cloudflare Email Routing | Keeps the personal inbox off the public site. Receive-only: replies go out from Gmail for now |
| URLs | `trailingSlash: "always"` | Matches Astro's `directory` build output and Workers' default `html_handling`; no redirect hops or duplicate URLs |
| Resume PDF | Print stylesheet on `/resume` | `experience.yaml` stays the only source; web and PDF can't drift |
| Projects | ~6 featured, hand-curated, grouped by theme | Write-ups explain *why*; no build-time dependency on the GitHub API |

Server features (e.g. a contact form) are out of scope for launch. If needed later, add `@astrojs/cloudflare` and opt individual routes into on-demand rendering.

## Launch scope

**v1 (ship it):**
- Home/About with the chosen one-liner and three theme paragraphs
- Projects page with the 6 featured projects (card summaries; detail pages optional)
- Resume page with print-to-PDF
- Blog with **one real post** (suggested: "Why I build AI that runs on your own machine")
- SEO basics (meta, sitemap, RSS, `Person` structured data, default OG image)
- Live on https://darylalim.com with `www` redirect and `hello@` email

**After launch (backlog):**
- Detail write-ups for every featured project
- Per-post OG images generated at build time
- Site search (e.g. Pagefind)
- Cloudflare Web Analytics (privacy-friendly, no cookie banner; needs a CSP allowance, see Phase 6)
- Photo on the home page
- Send mail as `hello@darylalim.com` (so replies don't reveal the Gmail address)
- Scheduled broken-link check (external links to GitHub repos rot over time)

Steps marked **[Daryl]** need Daryl's accounts or a manual action; everything else can be done in a Claude Code session.

## Project structure

```
.
├── CLAUDE.md               # project conventions for future Claude Code sessions
├── .nvmrc                  # pinned Node version (matches Workers Builds)
├── .prettierrc             # Prettier + prettier-plugin-astro
├── .github/dependabot.yml  # weekly dependency update PRs
├── astro.config.mjs        # site: "https://darylalim.com", integrations, CSP
├── wrangler.jsonc          # Worker name, assets dir, custom domain
├── public/
│   ├── _headers            # cache + non-CSP security headers
│   ├── robots.txt
│   ├── og-default.png      # 1200×630 default Open Graph image
│   └── favicon.svg
└── src/
    ├── content.config.ts   # collection schemas
    ├── content/
    │   ├── blog/           # *.md / *.mdx posts
    │   ├── projects/       # *.md project write-ups
    │   └── experience.yaml # resume entries (data collection)
    ├── components/         # Header, Footer, ProjectCard, PostList, Tag, ThemeToggle
    ├── layouts/            # BaseLayout (head/SEO), PostLayout
    ├── pages/
    │   ├── index.astro     # home / about
    │   ├── blog/index.astro
    │   ├── blog/[...slug].astro
    │   ├── blog/tags/[tag].astro
    │   ├── projects/index.astro
    │   ├── projects/[...slug].astro
    │   ├── resume.astro
    │   ├── rss.xml.ts
    │   └── 404.astro
    └── styles/global.css   # design tokens, typography, light/dark
```

## Content schemas (`src/content.config.ts`)

- **blog**: `title`, `description`, `pubDate`, `updatedDate?`, `tags: string[]`, `draft: boolean` (drafts excluded from production builds)
- **projects**: `title`, `description`, `theme: "on-device-ai" | "agents" | "healthcare" | "retrieval"`, `tech: string[]`, `url?`, `repo?`, `featured: boolean`, `date`
- **experience** (YAML, `file()` loader): `role`, `org`, `start`, `end?` (dates as `YYYY-MM`; no `end` = present), `location?` (city/remote only), `highlights: string[]`, `skills?: string[]` (used on the independent-work entry: languages, frameworks and models, each backed by a public repo)

## Phases

### Phase 1: Scaffold ✅
**Done 2026-10-30** (PRs #2, #4, #5). Production is live at https://darylalim-com.daryl-a-lim.workers.dev, and PRs get preview URLs. Astro 7.4.4, Wrangler 4.156.0.

- `npm create astro@latest`: minimal template, TypeScript strict
- Add integrations: `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`
- Dev dependencies: `@astrojs/check` and `typescript` (required by `astro check`, which runs in `build`), `wrangler`, `prettier`, `prettier-plugin-astro`
- `astro.config.mjs`: `site: "https://darylalim.com"`, `trailingSlash: "always"`
- A minimal `404.astro` now, so `not_found_handling` has a `404.html` to serve from the first deploy
- Create `wrangler.jsonc`:
  ```jsonc
  {
    "name": "darylalim-com",
    "compatibility_date": "<deploy date>",
    "assets": {
      "directory": "./dist",
      "not_found_handling": "404-page"
    },
    "previews": {}
  }
  ```
  - `previews` is required by `npx wrangler preview`, the Workers Builds preview command; without it every PR build fails. It stays empty because previews need no separate settings
- Scripts: `dev` (astro dev), `build` (astro check && astro build), `preview` (astro build && wrangler dev), `deploy` (astro build && wrangler deploy), `format` (prettier --write .)
- Repo hygiene:
  - Pin Node: `.nvmrc` plus `"engines"` in `package.json` (current LTS that meets Astro's minimum)
    - Major version only (`24`): Workers Builds then uses the Node 24 it has preinstalled; an exact pin would download Node on every build
  - Install scripts: npm 11.19+ blocks dependency install scripts by default. `esbuild`, `fsevents` and `workerd` are approved by name in `allowScripts` (not pinned to a version, so Dependabot updates keep working)
  - `.gitignore`: `node_modules/`, `dist/`, `.astro/`, `.wrangler/`, `.dev.vars`
  - Prettier with `prettier-plugin-astro` (`PLAN.md` is excluded, so its tables stay hand-formatted)
  - `.github/dependabot.yml`: weekly npm updates (each PR gets a Workers Builds preview), Astro packages grouped
    - TypeScript major updates are ignored: `@astrojs/check` supports TypeScript `^5 || ^6` only. Remove the rule once it accepts 7
  - `CLAUDE.md`: commands, content schemas, how to add a post or project, deploy and rollback steps
- First deploy (proves the pipeline on day one, before any design work):
  - **[Daryl]** Log in to Cloudflare (dashboard, and the Cloudflare MCP server in Claude Code)
  - Push to GitHub, then Cloudflare dashboard → Workers & Pages → Create → Import repository
    - **[Daryl]** Authorize the Cloudflare GitHub app for the `darylalim-com` repo
    - Build command: `npm run build`; deploy command: `npx wrangler deploy`
    - The Worker name in the dashboard must match `"name"` in `wrangler.jsonc`
  - Enable builds for non-production branches, so every PR gets a preview URL (preview command: `npx wrangler preview`, the default)
  - From here on, work happens on branches and merges to `main` through PRs
- **Done when:** `npm run preview` works locally, the starter is live on `darylalim-com.<account>.workers.dev`, and a test PR gets its own preview URL
- **Known quirk:** Worker Previews (open beta) return a plain-text `Not found` for unknown URLs instead of the custom `404.html`. Production serves the custom page correctly. It's a platform limitation, not a site bug; check 404 behaviour on production or with `npm run preview`
- **Tooling note:** macOS's built-in `curl` (LibreSSL 3.3.6) fails the TLS handshake with `*.workers.dev`. Use Node's `fetch` or a Homebrew `curl` to test deployed URLs

### Phase 2: Layout & design system ✅
**Done 2026-10-30** (PRs #7–#15). Lighthouse on `npm run preview`: home scores 100 in performance, accessibility, best practices and SEO on mobile and desktop; the 404 page scores 100 in accessibility and best practices.
- ~~Start with a font comparison~~ **Done 2026-10-30 (PR #7): IBM Plex chosen.** Configured through Astro's Fonts API as `--font-sans` and `--font-mono`
  - `local` provider pointed at the `@fontsource` package files, Latin subset only. The `npm` provider fails the build: its fallback-metrics step `fetch()`es `file://` URLs
  - Plex Sans is variable (one file); Plex Mono has no variable version, so only 400 and 600 are loaded. Add a weight to the config before using it in CSS
  - `<Font cssVariable="--font-sans" preload />` (and `--font-mono`) go in `BaseLayout`'s `<head>`
- `BaseLayout` with `<head>` SEO props (title, description, canonical, Open Graph, Twitter)
  - **Done (PR #8).** `src/layouts/BaseLayout.astro`, with site name and description in `src/consts.ts`. `image` defaults to `/og-default.png` (PR #14), with width, height and alt tags
- Design tokens in CSS custom properties: color, spacing, type scale
  - **Done (PR #9).** In `src/styles/global.css`. Colors use `light-dark()`, so each token holds both themes and the toggle only sets `data-theme` on `<html>`. Every text color passes WCAG AA on `bg` and `surface` in both themes
- Typography: IBM Plex Sans + IBM Plex Mono, self-hosted (no third-party requests); mono for headings, nav, tags and dates
- A single accent color, chosen in this phase against real pages
  - **Done 2026-10-30 (PR #11): teal**, `#0d7068` light and `#4fd1c0` dark (5.34:1 and 9.18:1 at worst). Chosen over blue, amber and violet on a comparison page: calm and clinical, fits on-device and healthcare work, not the default link blue or the usual AI violet
- Light/dark theme following `prefers-color-scheme`, plus a toggle (small `is:inline` script in `<head>` to avoid a flash of the wrong theme; it needs a manual CSP hash, see Phase 6)
  - **Done (PR #12).** `ThemeToggle.astro` in the header and an `is:inline` script in `BaseLayout`'s `<head>`. A choice is stored in `localStorage` only when it differs from the system setting, so toggling back means "follow the system" again. The button stays hidden without JS. The click handler is a normal Astro script, so CSP hashes it automatically; only the `<head>` script needs the manual hash
- Default OG image (`public/og-default.png`, 1200×630) in the site's type and colors
  - **Done (PR #14).** The source is `scripts/og-default.html` (dark tokens, Plex Mono, teal top bar). `npm run og` renders it with headless Chrome. Regenerate after changing the one-liner or the palette
  - `og:image` is an absolute `https://darylalim.com/...` URL (from `site`), so link previews only show it once the domain is live in Phase 5
- Shiki code highlighting with themes matched to light/dark (uses inline `style` attributes, so CSP needs an attribute-only allowance; see Phase 6)
  - **Done (PR #13).** `github-light-default` / `github-dark-default` with `defaultColor: "light-dark()"`, so tokens follow the theme toggle with no extra CSS. Chosen for contrast: of six pairs tested on `--color-surface`, it had the fewest failures (one)
  - A transformer in `astro.config.mjs` drops the theme background (code blocks use `--color-surface`) and darkens the light comment gray `#6e7781` → `#59636e` (4.09 → 5.50:1)
  - Applies to Markdown/MDX code fences. The `<Code />` component doesn't read `shikiConfig`; pass the same `themes`, `defaultColor` and `transformers` if it's ever used
- Header nav (Home, Blog, Projects, Resume) and footer (GitHub, LinkedIn, email, RSS)
  - **Done (PR #10).** `Header.astro` and `Footer.astro`, rendered by `BaseLayout` around `<main id="main">` with a skip link. Links live in `src/consts.ts`. GitHub and LinkedIn get `rel="me"`. Blog, Projects, Resume and RSS 404 until Phases 3–4
  - **Email is left out until Phase 5:** `hello@` has no MX record yet, so mail to it would bounce. Add it to `FOOTER_LINKS` once Email Routing works
- **Done when:** the layout is responsive at mobile and desktop widths and passes basic accessibility checks (contrast, focus states, landmarks)
- Favicon: a teal `dl` monogram on the dark surface, drawn as SVG shapes because favicons can't load web fonts. `favicon.ico` is a 32×32 PNG rendered from it (PR #15)
- **Findings:**
  - Lighthouse won't audit a URL that returns 404 (`ERRORED_DOCUMENT_REQUEST`). Audit the 404 page at `/404`, which Workers serves with status 200; unknown URLs correctly return 404 with the same page
  - The one remaining Lighthouse note is the render-blocking stylesheet (~140 ms estimated on throttled mobile). Revisit in Phase 6: `build.inlineStylesheets: "always"` removes it, and the CSP hashes inline styles anyway

### Phase 3: Pages & content ✅
**Done 2026-10-31** (PRs #17–#20). Every page renders real content and `astro check` passes.
- **Home/About**: short intro (see Content below), optional photo (monogram until then), featured projects (`featured: true`), latest 3 posts
  - **Done 2026-10-31.** The `dl` monogram as inline SVG in theme colors (no photo yet), the one-liner, "Independent AI engineer in Honolulu", three theme paragraphs ("What I build") linking to their Projects sections, a compact list of featured projects in theme order, and the latest 3 posts. The `Person` JSON-LD goes on this page in Phase 4
- **Blog**: index sorted by date, post pages with reading time, tag pages, previous/next links
  - **Done 2026-10-31.** `src/lib/posts.ts` (`getPosts()`) is the only way pages read posts: newest first, drafts included in `astro dev` only, so they never reach production or a preview build. A non-draft post that still contains `[TODO` fails the build. Post pages use `PostLayout.astro` (date, reading time at 230 wpm excluding code, tag links, older/newer links); tag pages exist only for tags a published post uses; Markdown styles are `.prose` in `global.css`
  - `/rss.xml` is built now rather than in Phase 4: full post HTML from the `glob()` loader's `rendered.html`, linked from every page's `<head>`
  - The first post, "Why I build AI that runs on your own machine", published 2026-10-31: drafted from the READMEs with `[TODO: …]` notes, which Daryl filled in. It credits mlx-vlm and Neywa Labs (no formal relationship; Daryl is quoted on their homepage)
  - The second post, "The model never does the math", published 2026-11-01 (PR #27): financial-planner-agent as the main story, grant-writer-agent as a shorter section on judgements. Facts and code from the two repos on GitHub, every figure recomputed (the README's "≈$1,770" is $1,768.11). Its Python and `text` blocks are the first Shiki code on the site, and they render under the CSP (checked in `npm run preview`, both themes, no console errors). The post says Daryl wrote grants at Pacific Gateway Center; the resume entry has said so since 2026-11-01 ("Wrote grant applications to fund the center's programs.")
- **Projects**: card grid grouped or filtered by `theme` (title, description, tech tags, links); detail pages for longer write-ups; "More on GitHub" link to the full repo list
  - **Done 2026-10-31.** `src/pages/projects/index.astro`: one section per theme, in the order of `PROJECT_THEMES` in `src/consts.ts`, which also builds the schema's `theme` enum. A single column of cards (`ProjectCard.astro`), because two columns at the 44rem measure made the cards tall and narrow and left half-empty rows. The title links to `url`, falling back to `repo`. Tech tags use `TagList.astro`, shared with the resume's skills. Detail pages stay in the backlog: a project's Markdown body is reserved for the longer write-up
  - Descriptions are drafted from each repo's README on GitHub, not local clones, which can be stale (granite-document-intelligence's was 59 commits behind and still described the earlier text-analysis app)
- **Resume**: rendered from `experience.yaml`, with an `@media print` stylesheet (hide nav/footer/theme toggle, black on white, sensible page breaks) and a "Download PDF" button that triggers the browser's print dialog
  - Privacy: no phone number or street address (LinkedIn exports include both); contact is `hello@` only
  - Content (decided 2026-10-31; source is the LinkedIn experience page as edited that day):
    - Work-first order: **Independent AI engineer**, `2025-09` to present, Honolulu, comes first, with highlights and `skills` drawn from the GitHub repos. No earlier AI work exists, so don't backdate it
    - The 2013–2016 political role is shown as *Assistant to the Chief of Staff, Office of a national political leader*, with **no `location`**, and no party, leader or country names (the visits are "in Europe and the Middle East"). This is a privacy decision: don't restore the details from old notes or exports
    - Also included: Rev.com (freelance transcriptionist, 2019–2020; ties to the transcription projects), East-West Center (APLP Fellow, 2017–2018), Pacific Gateway Center (Refugee Coordinator, 2012)
    - The 2020–2025 gap is left unexplained; there is no education section
  - **Done 2026-10-31.** `src/pages/resume.astro` from `src/content/experience.yaml` (five entries, from the LinkedIn text). Prints to one Letter/A4 page: site-wide print rules in `global.css` (black on white, no header/footer), page-break and spacing rules in the page. `blog` and `projects` join `content.config.ts` with their pages, since an empty `glob()` folder warns on every build
- Content: the real first post (kept `draft: true` until it's ready, so no placeholder ever ships), the 6 featured projects, real experience entries
- **Done when:** every page renders with real content and `astro check` passes

### Phase 4: SEO & feeds ✅
**Done 2026-11-01** (PR #21), including the follow-ups. The Rich Results Test on https://darylalim.com/ passed 2026-11-01: 1 valid Profile page, no errors or warnings, page fetch successful, indexing allowed.
- Already done in Phase 3: the RSS feed (full content, linked from every page's `<head>`) and the sitemap, which the integration has generated since Phase 1
- Sitemap generated automatically from `site` (URLs with trailing slashes, matching canonicals)
- RSS feed at `/rss.xml` with full post content, linked from `<head>`
- Open Graph: every page falls back to `og-default.png` (per-post images are in the backlog)
- Finish the `404.astro` page started in Phase 1 (design, links back to home/blog)
- `robots.txt` pointing to the sitemap
- Identity (to stand out from other people named Daryl Lim):
  - `Person` JSON-LD on the home page: `name`, `url`, `jobTitle`, `sameAs` → GitHub and LinkedIn
  - **[Daryl]** Link back to https://darylalim.com from the GitHub profile and LinkedIn (**done** 2026-11-01)
  - **[Daryl]** Google Search Console: verify `darylalim.com` with a DNS TXT record and submit the sitemap (after Phase 5). **Done 2026-11-01**: Domain property verified (the `google-site-verification` TXT record on the apex must stay, or verification lapses); sitemap submitted as the full URL `https://darylalim.com/sitemap-index.xml` (a Domain property rejects a bare file name). Status Success; the 8 pages in `sitemap-0.xml` show as discovered once Google reads the child sitemap
- **Built 2026-11-01** (`feat/seo`): `ProfilePage` JSON-LD with a `Person` as `mainEntity` on the home page only (Rich Results Test recognises `ProfilePage`, not a bare `Person`), with `sameAs` taken from the footer's `rel="me"` links and a city-level address (Honolulu, no street, per the privacy rules). It goes into a new `head` slot in `BaseLayout`. The 404 page explains itself and links to every nav item; `public/robots.txt` points to `sitemap-index.xml`. The sitemap already leaves out the 404. Validated on the preview: `npm run check:seo` (JSON-LD, OG, robots.txt, sitemap, RSS) passes, and the Rich Results Test finds 1 valid Profile page item. It also reports a crawl error, because Cloudflare adds `X-Robots-Tag: noindex` to every preview; re-run it on https://darylalim.com/ after Phase 5
- **Done when:** the sitemap, RSS and OG tags validate, and Google's Rich Results Test recognises the `Person` data

### Phase 5: Go live on darylalim.com ← next (only HSTS, step 7, left)
The pipeline already works from Phase 1; this phase attaches the domain and hardens the zone.

**Order (decided 2026-11-01):** harden the zone and set up email *before* attaching the domain, so darylalim.com is never live with weak settings. With no DNS records on the zone, the settings and Email Routing have no visible effect until the domain is attached. The numbered steps below are the reference; do them in this order:
1. **[Daryl]** Re-authorize the Cloudflare MCP server with write access (zone settings, DNS, Email Routing, Workers routes); the current connection is read-only
2. Zone settings (step 4), **except HSTS**: Email Address Obfuscation off, Minimum TLS 1.2, Always Use HTTPS on
3. Email Routing (step 5): enable it, **[Daryl]** verify the destination inbox, create `hello@`
4. One PR, `feat/custom-domain`: the `routes` custom domain (step 2) and `hello@darylalim.com` in `FOOTER_LINKS` (see the comment in `src/consts.ts`). Merging it puts the domain live with working email
5. The `www` redirect (step 3)
6. Verify: `npm run check:seo -- https://darylalim.com/`, the Rich Results Test, the HTTP→HTTPS and `www` redirects (path and query kept), and a test email to `hello@`
7. HSTS last, with a short `max-age` (e.g. 300); raise it after a few days with no problems. Browsers cache HSTS, so a mistake can't be undone for visitors who already have it

**Progress:**
- **2026-11-01, steps 1–3 done** (via the Cloudflare MCP server). Zone settings: Email Address Obfuscation off, Minimum TLS 1.2, Always Use HTTPS on (HSTS still off). Email Routing enabled: Cloudflare added 3 MX records, an SPF TXT and a DKIM TXT (`cf2024-1._domainkey`); the Gmail destination was already verified; rule `hello@darylalim.com` → Gmail. Catch-all left off (drop), so other addresses bounce
- **Step 4 done 2026-11-01** (PR #23): `routes` plus an explicit `"workers_dev": true`, because Wrangler turns workers.dev off by default once `routes` is set; the workers.dev URL stays as a fallback, and canonicals already point to darylalim.com
- **Step 5 done 2026-11-01**: proxied `AAAA www → 100::` plus a Single Redirect rule (`http.host eq "www.darylalim.com"` → `concat("https://darylalim.com", http.request.uri.path)`, 301, query string kept)
- **Step 6 done 2026-11-01**, except the **[Daryl]** checks: `npm run check:seo -- https://darylalim.com/` passes; HTTP→HTTPS and `www` → apex return 301 in one hop with path and query kept; production sends no `X-Robots-Tag: noindex`; the test email to `hello@` arrived; workers.dev still serves the site. Rich Results Test on https://darylalim.com/ passed (1 valid Profile page, 0 errors, 0 warnings, indexing allowed). Search Console verified and the sitemap submitted (Phase 4)
- **Step 7** (HSTS): not before 2026-11-04, so problems from the domain switch show up before browsers cache HSTS
1. Pre-flight DNS check on the `darylalim.com` zone:
   - Existing A/AAAA/CNAME records on `darylalim.com` will block attaching the Worker custom domain; remove or replace them
   - Existing MX records will clash with Email Routing; decide whether anything currently receives mail there
   - **Checked 2026-10-30 (read-only, via the Cloudflare MCP server): passed.** Zone active on the Free plan with Cloudflare nameservers; no DNS records at all (no A/AAAA/CNAME/MX), Email Routing unconfigured, no Worker custom domains. Re-check only if records are added before Phase 5
   - **Re-checked 2026-11-01 (read-only): passed, unchanged.** Still no DNS records, Email Routing unconfigured, no Worker custom domains, no redirect rules. Zone settings as in the "Now" column of step 4
2. Add the custom domain in `wrangler.jsonc` and merge:
   ```jsonc
   "routes": [{ "pattern": "darylalim.com", "custom_domain": true }]
   ```
3. `www.darylalim.com` → `darylalim.com`: proxied DNS record for `www` (e.g. `AAAA 100::`) + a Cloudflare Redirect Rule (301, keep path and query)
4. Zone settings (current values from the 2026-10-30 check → target):
   | Setting | Now (2026-11-01) | Target | Why |
   | --- | --- | --- | --- |
   | Email Address Obfuscation | on → off (2026-11-01) | **off** | Injects a decode script the CSP blocks, breaking the `hello@` link |
   | Rocket Loader | off | off | Rewrites script loading; already correct |
   | Auto Minify | — | off (if still present) | Can break hydration |
   | Always Use HTTPS | off → on (2026-11-01) | **on** | Redirect all HTTP to HTTPS |
   | HSTS | off | **on** | Start with a short `max-age`, raise it once everything is confirmed on HTTPS |
   | Minimum TLS version | 1.0 → 1.2 (2026-11-01) | **1.2** | TLS 1.0/1.1 are deprecated; no current browser needs them |
   | SSL/TLS mode | Full | Full | Fine for Workers custom domains |
   - Changing these needs a Cloudflare MCP session with write access (**[Daryl]** re-authorize with a broader scope than "Read only"), or the dashboard
5. Email Routing: enable it on the zone, **[Daryl]** verify the destination inbox, and create `hello@darylalim.com` → personal inbox (Cloudflare adds the MX/SPF records)
6. Rollback: a bad deploy is reverted with `npx wrangler rollback` (or from the Worker's Deployments tab); document this in `CLAUDE.md` (**done**: see "Git and deploys" in `CLAUDE.md`)
- **Done when:** https://darylalim.com serves the site, `www` redirects with the path preserved, HTTP redirects to HTTPS, and a test email to `hello@` arrives

### Phase 6: Performance & polish ✅
- `public/_headers`: long cache on `/_astro/*` (hashed assets) and security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy: frame-ancestors 'none'`)
  - `frame-ancestors` is ignored in a `<meta>` CSP, so clickjacking protection must be a header. A header containing only `frame-ancestors` doesn't restrict scripts or styles, so it can't conflict with Astro's per-page hashes
- Content Security Policy via Astro's `security.csp` (emits a per-page `<meta>` with hashes for the scripts and styles Astro processes)
  - **Done 2026-11-01 (step 1, `feat/security-headers`):** `public/_headers` and `security.csp` in `astro.config.mjs`. Changes from the draft: the theme script's hash is computed in the config from `BaseLayout.astro` instead of pasted by hand, so it can't go stale, and a `check-theme-script-hash` integration fails the build if the built script doesn't match it; `'self'` is scoped to `style-src-elem` (Astro warns when a plain `style-src` source is mixed with `style-src-attr`); added `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. Astro still prints a generic "Shiki … not compatible with CSP" warning; `style-src-attr 'unsafe-inline'` is the fix for it, so ignore it
  - Checked in `npm run preview`: headers on pages, `/_astro/*` (incl. fonts) cached immutable, stored theme applies before paint, toggle and resume print button work, style attributes allowed, injected inline `<style>`/`<script>` blocked, no console errors
  - If Cloudflare Web Analytics is enabled later, allow its script origin in `scriptDirective.resources`, or the beacon is silently blocked
- Use Astro `<Image />` for photos/screenshots (build-time optimization)
  - **Deferred:** the site has no photos or screenshots yet. Use `<Image />` when the first one is added (e.g. the optional photo)
- Lighthouse / Core Web Vitals audit; target 95+ in every category
  - **Done 2026-11-01** on production (Lighthouse CLI, headless Chrome), after the CSP went live (PR #25): home, the first blog post and `/projects/` score **100** in Performance, Accessibility, Best Practices and SEO, on both mobile and desktop. Mobile: LCP 0.8 s, CLS 0, TBT 0 ms; desktop LCP 0.2 s
  - The only flags are two unscored insights (render-blocking, network dependency tree), both about the single 2.3 KB stylesheet. Left as is: inlining it into every page would save one round trip but lose caching across pages
- **Done when:** Lighthouse scores meet the target on home, a blog post and the projects page

## Content

### Bio
Positioning is built from three themes in the GitHub work:
1. **Private, on-device AI on Apple Silicon (MLX)**: granit, qwn, granite-speech-intelligence, translation apps
2. **Agent systems on Deep Agents + Claude**: grant-writer, financial-planner, real-estate, research agents
3. **Healthcare and clinical AI**: deepgram-clinical-transcription, medgemma-studio, the Corti builds

Home page one-liner (chosen): *"I build AI that runs on your own machine, and agents that show their work."*

The About section expands on the three themes above, one short paragraph each.

### Featured projects (approved)
| Theme | Project | Angle |
| --- | --- | --- |
| On-device AI | granit | Broadest scope: speech, docs, vision, hybrid search, guard model, all local |
| On-device AI | granite-document-intelligence | Concrete output: PDF → Markdown/JSON, charts, tables |
| Agents | grant-writer-agent | Most-starred; quotes evidence, human approval of final files |
| Agents | financial-planner-agent | Every figure from a deterministic tool, never the model |
| Healthcare | deepgram-clinical-transcription | Audit trail that holds no patient data by design |
| Retrieval | rag-pipeline | Includes a LangSmith-judged eval |

### Links
- GitHub: https://github.com/darylalim
- Email: hello@darylalim.com (Cloudflare Email Routing, live 2026-11-01)
- LinkedIn: https://www.linkedin.com/in/daryl-lim-862a815

## Pending from Daryl
- [x] LinkedIn URL
- [x] Approve the 6 featured projects
- [x] Font pairing: IBM Plex (chosen 2026-10-30 on the comparison page)
- [x] Bio one-liner (option B)
- [ ] Photo (optional; launch without one if needed)
- [x] Topic for the first blog post: "Why I build AI that runs on your own machine" (chosen 2026-10-31)
- [x] First post written and published (2026-10-31)
- [x] Resume content for `experience.yaml` (from LinkedIn, 2026-10-31; rules under Phase 3 → Resume)
