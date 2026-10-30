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
- **experience** (YAML, `file()` loader): `role`, `org`, `start`, `end?` (dates as `YYYY-MM`; no `end` = present), `location?` (city/remote only), `highlights: string[]`

## Phases

### Phase 1: Scaffold
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
    }
  }
  ```
- Scripts: `dev` (astro dev), `build` (astro check && astro build), `preview` (astro build && wrangler dev), `deploy` (astro build && wrangler deploy), `format` (prettier --write .)
- Repo hygiene:
  - Pin Node: `.nvmrc` plus `"engines"` in `package.json` (current LTS that meets Astro's minimum)
  - `.gitignore`: `node_modules/`, `dist/`, `.astro/`, `.wrangler/`, `.dev.vars`
  - Prettier with `prettier-plugin-astro`
  - `.github/dependabot.yml`: weekly npm updates (each PR gets a Workers Builds preview)
  - `CLAUDE.md`: commands, content schemas, how to add a post or project, deploy and rollback steps
- First deploy (proves the pipeline on day one, before any design work):
  - **[Daryl]** Log in to Cloudflare (dashboard, and the Cloudflare MCP server in Claude Code)
  - Push to GitHub, then Cloudflare dashboard → Workers & Pages → Create → Import repository
    - **[Daryl]** Authorize the Cloudflare GitHub app for the `darylalim-com` repo
    - Build command: `npm run build`; deploy command: `npx wrangler deploy`
    - The Worker name in the dashboard must match `"name"` in `wrangler.jsonc`
  - Enable builds for non-production branches, so every PR gets a preview URL
  - From here on, work happens on branches and merges to `main` through PRs
- **Done when:** `npm run preview` works locally, the starter is live on `darylalim-com.<account>.workers.dev`, and a test PR gets its own preview URL

### Phase 2: Layout & design system
- `BaseLayout` with `<head>` SEO props (title, description, canonical, Open Graph, Twitter)
- Design tokens in CSS custom properties: color, spacing, type scale
- Typography: a sans + mono pair from one family (IBM Plex Sans/Mono or Geist/Geist Mono), self-hosted (no third-party requests); mono for headings, nav, tags and dates
- A single accent color, chosen in this phase against real pages
- Light/dark theme following `prefers-color-scheme`, plus a toggle (small `is:inline` script in `<head>` to avoid a flash of the wrong theme; it needs a manual CSP hash, see Phase 6)
- Default OG image (`public/og-default.png`, 1200×630) in the site's type and colors
- Shiki code highlighting with themes matched to light/dark (uses inline `style` attributes, so CSP needs an attribute-only allowance; see Phase 6)
- Header nav (Home, Blog, Projects, Resume) and footer (GitHub, LinkedIn, email, RSS)
- **Done when:** the layout is responsive at mobile and desktop widths and passes basic accessibility checks (contrast, focus states, landmarks)

### Phase 3: Pages & content
- **Home/About**: short intro (see Content below), optional photo (monogram until then), featured projects (`featured: true`), latest 3 posts
- **Blog**: index sorted by date, post pages with reading time, tag pages, previous/next links
- **Projects**: card grid grouped or filtered by `theme` (title, description, tech tags, links); detail pages for longer write-ups; "More on GitHub" link to the full repo list
- **Resume**: rendered from `experience.yaml`, with an `@media print` stylesheet (hide nav/footer/theme toggle, black on white, sensible page breaks) and a "Download PDF" button that triggers the browser's print dialog
  - Privacy: no phone number or street address (LinkedIn exports include both); contact is `hello@` only
- Content: the real first post (kept `draft: true` until it's ready, so no placeholder ever ships), the 6 featured projects, real experience entries
- **Done when:** every page renders with real content and `astro check` passes

### Phase 4: SEO & feeds
- Sitemap generated automatically from `site` (URLs with trailing slashes, matching canonicals)
- RSS feed at `/rss.xml` with full post content, linked from `<head>`
- Open Graph: every page falls back to `og-default.png` (per-post images are in the backlog)
- Finish the `404.astro` page started in Phase 1 (design, links back to home/blog)
- `robots.txt` pointing to the sitemap
- Identity (to stand out from other people named Daryl Lim):
  - `Person` JSON-LD on the home page: `name`, `url`, `jobTitle`, `sameAs` → GitHub and LinkedIn
  - **[Daryl]** Link back to https://darylalim.com from the GitHub profile and LinkedIn
  - **[Daryl]** Google Search Console: verify `darylalim.com` with a DNS TXT record and submit the sitemap (after Phase 5)
- **Done when:** the sitemap, RSS and OG tags validate, and Google's Rich Results Test recognises the `Person` data

### Phase 5: Go live on darylalim.com
The pipeline already works from Phase 1; this phase attaches the domain and hardens the zone.
1. Pre-flight DNS check on the `darylalim.com` zone:
   - Existing A/AAAA/CNAME records on `darylalim.com` will block attaching the Worker custom domain; remove or replace them
   - Existing MX records will clash with Email Routing; decide whether anything currently receives mail there
   - **Checked 2026-10-30 (read-only, via the Cloudflare MCP server): passed.** Zone active on the Free plan with Cloudflare nameservers; no DNS records at all (no A/AAAA/CNAME/MX), Email Routing unconfigured, no Worker custom domains. Re-check only if records are added before Phase 5
2. Add the custom domain in `wrangler.jsonc` and merge:
   ```jsonc
   "routes": [{ "pattern": "darylalim.com", "custom_domain": true }]
   ```
3. `www.darylalim.com` → `darylalim.com`: proxied DNS record for `www` (e.g. `AAAA 100::`) + a Cloudflare Redirect Rule (301, keep path and query)
4. Zone settings (current values from the 2026-10-30 check → target):
   | Setting | Now | Target | Why |
   | --- | --- | --- | --- |
   | Email Address Obfuscation | on | **off** | Injects a decode script the CSP blocks, breaking the `hello@` link |
   | Rocket Loader | off | off | Rewrites script loading; already correct |
   | Auto Minify | — | off (if still present) | Can break hydration |
   | Always Use HTTPS | off | **on** | Redirect all HTTP to HTTPS |
   | HSTS | off | **on** | Start with a short `max-age`, raise it once everything is confirmed on HTTPS |
   | Minimum TLS version | 1.0 | **1.2** | TLS 1.0/1.1 are deprecated; no current browser needs them |
   | SSL/TLS mode | Full | Full | Fine for Workers custom domains |
   - Changing these needs a Cloudflare MCP session with write access (**[Daryl]** re-authorize with a broader scope than "Read only"), or the dashboard
5. Email Routing: enable it on the zone, **[Daryl]** verify the destination inbox, and create `hello@darylalim.com` → personal inbox (Cloudflare adds the MX/SPF records)
6. Rollback: a bad deploy is reverted with `npx wrangler rollback` (or from the Worker's Deployments tab); document this in `CLAUDE.md`
- **Done when:** https://darylalim.com serves the site, `www` redirects with the path preserved, HTTP redirects to HTTPS, and a test email to `hello@` arrives

### Phase 6: Performance & polish
- `public/_headers`: long cache on `/_astro/*` (hashed assets) and security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Content-Security-Policy: frame-ancestors 'none'`)
  - `frame-ancestors` is ignored in a `<meta>` CSP, so clickjacking protection must be a header. A header containing only `frame-ancestors` doesn't restrict scripts or styles, so it can't conflict with Astro's per-page hashes
- Content Security Policy via Astro's `security.csp` (emits a per-page `<meta>` with hashes for the scripts and styles Astro processes):
  ```js
  security: {
    csp: {
      directives: ["default-src 'self'", "img-src 'self' data:", "font-src 'self'"],
      // The is:inline theme script isn't processed by Astro, so its hash is added by hand.
      // Regenerate it whenever the script changes.
      scriptDirective: { hashes: ["sha256-<theme-script-hash>"] },
      // Shiki writes inline style attributes; allow those only, not inline <style> or scripts
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }] },
    },
  },
  ```
  - CSP is not active in `astro dev`; test with `npm run preview`, and confirm the theme toggle works with no CSP errors in the console
  - If Cloudflare Web Analytics is enabled later, allow its script origin in `scriptDirective.resources`, or the beacon is silently blocked
- Use Astro `<Image />` for photos/screenshots (build-time optimization)
- Lighthouse / Core Web Vitals audit; target 95+ in every category
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
- Email: hello@darylalim.com (after Phase 5 Email Routing)
- LinkedIn: https://www.linkedin.com/in/daryl-lim-862a815

## Pending from Daryl
- [x] LinkedIn URL
- [x] Approve the 6 featured projects
- [ ] Font pairing: IBM Plex or Geist (decide in Phase 2 by comparing on real pages)
- [x] Bio one-liner (option B)
- [ ] Photo (optional; launch without one if needed)
- [ ] Topic for the first blog post (suggested: "Why I build AI that runs on your own machine")
- [ ] Resume content for `experience.yaml`: roles, orgs, dates, 2–4 highlights each (needed by Phase 3; an existing CV or LinkedIn export works)
