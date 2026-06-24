# SchulyKeycloak documentation

Schuly's own [Keycloak](https://www.keycloak.org/) image — the production identity
provider for Schuly. The container bakes in a [Keycloakify](https://keycloakify.dev)
login theme (as a provider jar), a leaked-password blacklist (rockyou), and the
`schuly` realm, then ships as an *optimized* Keycloak build so production startup is
fast. Releases push a multi-arch image to `ghcr.io/schulydev/schulykeycloak`.

## Repository layout

| Path | Purpose |
|---|---|
| `Dockerfile` | Multi-stage build: theme jar → rockyou blacklist → optimized Keycloak 26.6 → runtime image. |
| `keycloakify/` | The branded login theme (Keycloakify 11, React + Tailwind + shadcn). Built into a provider jar at image build time. |
| `realms/schuly-realm.json` | The `schuly` realm (roles, groups, client scopes, 2FA browser flow). Imported on first start. |
| `compose.dev.yml` | Local dev: `start-dev --import-realm`, admin/admin on `:8080`. |
| `scripts/keycloak-export.{sh,ps1,bat}` | Round-trip realm edits from the running container back into `realms/`. |
| `.github/workflows/docker-publish-release.yaml` | Build + push the multi-arch image on a GitHub release. |
| `application.properties` | Single source of truth for the version; CI syncs it to the release tag. |

## Docs index

- [Development setup](setup/development.md) — run the image locally with Docker Compose.
- [Production setup](setup/production.md) — run the optimized image against a Postgres DB.
- [Release](setup/release.md) — cut a release and publish images.
- [Realm management](realm-management.md) — edit and snapshot the `schuly` realm.
- [Theme development](theme-development.md) — work on the Keycloakify login theme.
- [Contributing](contributing.md) — the issue → branch → PR workflow.

<!-- docs-sync pipeline test -->
