# Configuration reference

Everything you can configure on the Schuly Keycloak image, in one place. The image
is an **optimized** Keycloak 26.6 build, so the database vendor, health, and metrics
are already baked in at build time - at runtime you mainly provide the database
connection, the public hostname, and a bootstrap admin.

## Ports

| Port | Purpose | Expose publicly? |
|---|---|---|
| `8080` | HTTP - login pages, OIDC/SAML endpoints, admin console, admin REST API. | Yes, via your reverse proxy (which terminates TLS). |
| `9000` | Management - `/health`, `/health/ready`, `/health/live`, `/metrics`. | **No.** Keep internal; never proxy it to the internet. |

## Runtime environment variables

Set these on the container (e.g. `environment:` in Compose, or `-e` on `docker run`).

| Variable | Required | Purpose |
|---|---|---|
| `KC_DB_URL` | Yes | JDBC URL of the Postgres database, e.g. `jdbc:postgresql://db:5432/keycloak`. |
| `KC_DB_USERNAME` | Yes | Database user. |
| `KC_DB_PASSWORD` | Yes | Database password. |
| `KC_HOSTNAME` | Yes (prod) | Public URL Keycloak is served at, e.g. `https://auth.schuly.dev`. Keycloak builds all issuer/redirect URLs from this. |
| `KC_PROXY_HEADERS` | Yes (behind a proxy) | Set to `xforwarded` when a reverse proxy terminates TLS and forwards `X-Forwarded-*` headers (use `forwarded` if it sends RFC 7239 `Forwarded`). |
| `KC_HTTP_ENABLED` | Yes (behind a proxy) | `true` to let the backend serve plain HTTP on `8080` while the proxy handles HTTPS. |
| `KC_BOOTSTRAP_ADMIN_USERNAME` | first start only | Temporary bootstrap admin username. Use it once to create a real admin, then remove it. |
| `KC_BOOTSTRAP_ADMIN_PASSWORD` | first start only | Temporary bootstrap admin password. |
| `KC_HTTP_PORT` | - | Override the HTTP port (default `8080`). |
| `KC_LOG_LEVEL` | - | Root log level (e.g. `info`, `debug`). |

> Don't set `KC_DB` - the image is built for Postgres. Re-pointing the vendor would
> require rebuilding the optimized image.

## SMTP (realm email)

The `schuly` realm's mail server is filled in from the container environment at
startup - the realm ships `${env.SMTP_*}` placeholders that
`scripts/resolve-realm-env.sh` resolves before the import runs. Leave them unset and
the realm imports with no working mail server, which is fine until you want verified
emails or self-service password reset.

| Variable | Required | Purpose |
|---|---|---|
| `SMTP_HOST` | for mail | Mail server hostname. |
| `SMTP_PORT` | for mail | Mail server port, e.g. `587`. |
| `SMTP_FROM` | - | Sender address. Defaults to `noreply@localhost`; set a real address before enabling mail. |
| `SMTP_USER` | for mail | SMTP username (the realm sends `auth: true`). |
| `SMTP_PASSWORD` | for mail | SMTP password. |
| `SMTP_SSL` | - | `true` for implicit TLS. |
| `SMTP_STARTTLS` | - | `true` for STARTTLS. |

> These only apply on the **first** start, when the realm is imported. Changing them
> later has no effect on an existing realm - edit the mail settings in the admin
> console instead (**Realm settings → Email**).

## Baked-in build settings

These are fixed at image-build time (`kc.sh build`) and generally not changed at runtime:

| Setting | Value | Where |
|---|---|---|
| Database vendor | `KC_DB=postgres` | `Dockerfile` (builder stage) |
| Health endpoints | `KC_HEALTH_ENABLED=true` | `Dockerfile` (builder stage) |
| Metrics endpoint | `KC_METRICS_ENABLED=true` | `Dockerfile` (builder stage) |
| Start command | `start --optimized --import-realm` | `Dockerfile` (`CMD`) |
| Password blacklist path | `JAVA_OPTS_APPEND=-Dkeycloak.password.blacklists.path=…` | `Dockerfile` (`ENV`) |

## Baked-in behavior

- **Realm import** - the `schuly` realm is imported on **first** start. On later
  starts an existing realm is left untouched. See [Realm management](realm-management.md).
- **Leaked-password blacklist** - the rockyou list ships at
  `/opt/keycloak/password-blacklists/rockyou.txt`; the realm's password policy uses
  `passwordBlacklist(rockyou.txt)`.
- **Login theme** - the `schuly` Keycloakify theme is installed as a provider jar and
  selected by the realm (`loginTheme: "schuly"`). See [Theme development](theme-development.md).

## Volumes

In production (Postgres) all state lives in the database, so **no volume is required**.
The realm import files are baked into the image at `/opt/keycloak/data/import`.

Local dev is different: it uses an embedded H2 database persisted in the
`keycloak-data-dev` named volume - see [Development setup](setup/development.md).
