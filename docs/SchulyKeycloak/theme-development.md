# Theme development

The branded login theme lives in `keycloakify/`. It's a
[Keycloakify](https://keycloakify.dev) 11 project (React 18 + Vite + Tailwind CSS 4,
with shadcn-style UI components under `src/components/ui`). The Vite config names the
theme `schuly` and builds only the login theme (`accountThemeImplementation: "none"`).

## Toolchain

- **Bun** is the package manager (a `bun.lock` is committed). Install deps with
  `bun install`.
- Node engine: `^18 || >=20` (the build image uses Node 22).
- **Maven** is required by Keycloakify to package the provider jar (the Docker
  theme stage installs it).

Scripts (`keycloakify/package.json`):

| Script | What it does |
|---|---|
| `bun run dev` | Vite dev server for fast iteration on the theme. |
| `bun run build` | `tsc && vite build`. |
| `bun run build-keycloak-theme` | `build` then `keycloakify build` - produces the provider jar(s). |
| `bun run storybook` | Storybook (`-p 6006`) for previewing login pages in isolation. |
| `bun run format` | Prettier. |

> Storybook config is under `keycloakify/.storybook/`. Use it to develop login
> pages without a running Keycloak.

## Local theme iteration

```sh
cd keycloakify
bun install
bun run dev          # or: bun run storybook
```

## How the theme reaches the image

The theme is **not** a runtime dependency you install separately - it's baked into
the image. In the `Dockerfile`'s first stage (`node:22` + Maven), the theme is built
with `npm run build-keycloak-theme`, and the resulting
`dist_keycloak/keycloak-theme-for-kc-all-other-versions.jar` is copied into the
Keycloak builder stage as
`/opt/keycloak/providers/schuly-keycloak-theme.jar`. The optimized
`kc.sh build` then bakes it into the final image. The realm selects it via
`loginTheme: "schuly"`.

> The Docker theme stage uses `npm install` / `npm run build-keycloak-theme`. The
> committed `bun.lock` is for local development; the image build does not rely on it.

After changing the theme, rebuild the image (`docker compose -f compose.dev.yml up
--build`) to see it in the running console.
