# Production setup

In production, run the published image
`ghcr.io/schulydev/schulykeycloak:latest` (or a pinned `:<semver>` tag - see
[Release](release.md)). The image is an **optimized** Keycloak build (`kc.sh build`
runs at image-build time), so the runtime entrypoint starts with
`start --optimized --import-realm` for fast startup. It is pre-built for Postgres
(`KC_DB=postgres`), with health and metrics enabled.

> Deploying the whole stack (Postgres + reverse proxy + TLS) from scratch? Follow
> [Self-hosting the full stack](self-hosting.md) instead - it has a complete
> docker-compose and first-admin walkthrough.

## Run

```sh
docker run -p 8080:8080 \
  -e KC_DB_URL=jdbc:postgresql://db:5432/keycloak \
  -e KC_DB_USERNAME=keycloak \
  -e KC_DB_PASSWORD=... \
  -e KC_HOSTNAME=https://auth.schuly.dev \
  -e KC_PROXY_HEADERS=xforwarded \
  -e KC_HTTP_ENABLED=true \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=... \
  ghcr.io/schulydev/schulykeycloak:latest
```

The essential variables are the database connection (`KC_DB_*`), the public hostname
(`KC_HOSTNAME`), the proxy settings when behind a TLS-terminating proxy
(`KC_PROXY_HEADERS`, `KC_HTTP_ENABLED`), and a first-start bootstrap admin
(`KC_BOOTSTRAP_ADMIN_*`). The full list - every variable, port, and baked-in default
- is in the [Configuration reference](../configuration.md).

> **Security:** the bootstrap admin is temporary - create a real admin and remove the
> `KC_BOOTSTRAP_ADMIN_*` variables after first start. Never commit secrets or place
> them in `realms/schuly-realm.json`, keep TLS terminated at the proxy, and don't
> expose the management port `9000` publicly.
