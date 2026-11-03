# Deployment

Use this page to see how the site reaches Cloudflare Pages and what to check when you change the
build. The Cloudflare GitHub integration handles deploys. It's set up in the Cloudflare dashboard, not
in a GitHub Actions workflow.

## What deploys

- Pushes to `main` deploy to production.
- Pull request branches get preview deploys.

## Cloudflare build settings

| Setting | Value |
| --- | --- |
| Build command | `bun run build` |
| Output directory | `dist/SchulyWebsite/browser` |
| Environment | `BUN_VERSION=1.2.21` |

The `@angular/build:application` builder in `angular.json` produces the output directory. If you change
the project name, builder, or output settings in `angular.json`, check that the Cloudflare output path
still matches.

The deploy also uses `public/_redirects`, `public/_headers`, and the Pages Function in
`functions/index.js`.

## CI

`.github/workflows/build.yml` doesn't deploy anything. On pushes and pull requests to `main`, it runs
`bun install --frozen-lockfile` and `bun run build` with the latest Bun, so it catches broken code
before Cloudflare tries a preview deploy.
