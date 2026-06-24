# Production setup

In production, run the published image
`ghcr.io/schulydev/schulykeycloak:latest` (or a pinned `:<semver>` tag — see
[Release](release.md)). The image is an **optimized** Keycloak build (`kc.sh build`
runs at image-build time), so the runtime entrypoint starts with
`start --optimized --import-realm` for fast startup. It is pre-built for the
Postgres database vendor (`KC_DB=postgres`), with health and metrics endpoints
enabled.

## Run

```sh
docker run -p 8080:8080 \
  -e KC_DB_URL=jdbc:postgresql://db:5432/keycloak \
  -e KC_DB_USERNAME=keycloak \
  -e KC_DB_PASSWORD=... \
  -e KC_HOSTNAME=https://auth.schuly.dev \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=... \
  ghcr.io/schulydev/schulykeycloak:latest
```

## Environment variables

| Variable | Purpose |
|---|---|
| `KC_DB_URL` | JDBC URL of the Postgres database. |
| `KC_DB_USERNAME` | Database user. |
| `KC_DB_PASSWORD` | Database password. |
| `KC_HOSTNAME` | Public hostname/URL Keycloak is served at (e.g. `https://auth.schuly.dev`). |
| `KC_BOOTSTRAP_ADMIN_USERNAME` | Temporary bootstrap admin username (create a permanent admin, then remove). |
| `KC_BOOTSTRAP_ADMIN_PASSWORD` | Temporary bootstrap admin password. |

## Baked-in defaults

- **Realm import** — the `schuly` realm is imported on first start; on subsequent
  starts an existing realm is left as-is.
- **Leaked-password blacklist** — the rockyou list is shipped at
  `/opt/keycloak/password-blacklists/rockyou.txt` and wired up via
  `JAVA_OPTS_APPEND`. The realm's password policy references
  `passwordBlacklist(rockyou.txt)`.
- **Login theme** — the `schuly` Keycloakify theme is installed as a provider jar
  and selected by the realm (`loginTheme: "schuly"`).
