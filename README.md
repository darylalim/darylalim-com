# darylalim.com

Source for [darylalim.com](https://darylalim.com), my developer portfolio: projects, blog and resume. It is a fully static Astro site served by Cloudflare Workers static assets.

## Development

Requires Node 24 (pinned in `.nvmrc`).

```sh
npm install
npm run dev       # Astro dev server
npm run build     # type check, then build into dist/
npm run preview   # build, then serve dist/ in the Workers runtime
npm run format    # format with Prettier
```

Use `npm run preview`, not `npm run dev`, to check 404 pages, trailing-slash redirects, headers and the CSP.

## Content

| Content  | Location                                                        |
| -------- | --------------------------------------------------------------- |
| Projects | `src/content/projects/<repo-name>.md`                           |
| Posts    | `src/content/blog/<slug>.md` (start with `draft: true`)         |
| Resume   | `src/content/experience.yaml`                                   |
| Site     | `src/consts.ts` (name, description, nav, links, project themes) |

## Deploys

Workers Builds deploys `main` to production and builds every other branch as a preview, with the URL posted on its pull request. Changes reach `main` only through pull requests.

## Docs

- `CLAUDE.md`: all commands and conventions
- `PLAN.md`: decisions, phases and launch scope
