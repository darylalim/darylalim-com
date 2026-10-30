# darylalim-com

My website built with Astro and Cloudflare.

Live at https://darylalim.com (custom domain from Phase 5; until then https://darylalim-com.daryl-a-lim.workers.dev).

## Development

Requires Node 24 (see `.nvmrc`).

```sh
npm install
npm run dev       # local dev server
npm run preview   # build and serve in the Workers runtime
```

Pushes to `main` deploy through Workers Builds; pull requests get preview URLs. See `CLAUDE.md` for commands and conventions, and `PLAN.md` for the build plan.
