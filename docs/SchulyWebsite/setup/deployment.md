# Deployment

The site is hosted on **Cloudflare Pages**. Deployment is wired through the
**Cloudflare GitHub integration** (configured in the Cloudflare dashboard, **not**
a GitHub Actions workflow in this repo).

## Production deploys

- Pushes to **`main`** are auto-deployed by Cloudflare Pages.
- **PR branches** get **preview deploys** automatically via the same integration.

## Cloudflare build settings

| Setting | Value |
|---|---|
| Build command | `bun run build` |
| Output directory | `dist/SchulyWebsite/browser` |
| Environment | `BUN_VERSION=1.2.21` |

The build uses the `@angular/build:application` builder (see `angular.json`),
which produces the `dist/SchulyWebsite/browser` directory that Cloudflare is
configured to serve. **If you change `angular.json`** (project name, builder, or
output settings), verify the Cloudflare output path still matches.

## CI vs. deploy

`.github/workflows/build.yml` is **independent** of deployment. It only runs
`bun install --frozen-lockfile` + `bun run build` on pushes and PRs to `main` to
verify the build passes - catching broken code before Cloudflare attempts a
preview deploy. It does not publish anything itself.

## Related

- [Development setup](development.md)
- [Release](release.md)
