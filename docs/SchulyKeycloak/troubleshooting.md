# Troubleshooting

Common failures, what causes them, and how to fix them.

## The login page looks like default Keycloak (not branded)

The `schuly` theme jar isn't loaded, or the realm isn't using it.

- Confirm the realm's `loginTheme` is `schuly` (`realms/schuly-realm.json`).
- If you changed theme code, rebuild the image — the theme is baked in at build time,
  not loaded at runtime: `docker compose -f compose.dev.yml up --build`. See
  [Theme development](theme-development.md).

## Infinite redirects, "HTTPS required", or wrong URLs in the browser

Keycloak doesn't know its public URL or isn't trusting the proxy headers.

- Set `KC_HOSTNAME` to the full public URL (e.g. `https://auth.schuly.dev`).
- Behind a TLS-terminating proxy, set `KC_PROXY_HEADERS=xforwarded` and
  `KC_HTTP_ENABLED=true`, and make sure the proxy forwards `X-Forwarded-*` headers.
- See [Self-hosting the full stack](setup/self-hosting.md).

## Realm edits to the JSON don't show up

The realm is imported only on the **first** start; afterwards an existing realm is
left as-is.

- **Local dev:** reset the data volume to re-import —
  `docker compose -f compose.dev.yml down -v && docker compose -f compose.dev.yml up --build`.
- **Production:** the realm already exists in Postgres; apply changes in the admin
  console and snapshot them back with the export script (see
  [Realm management](realm-management.md)). Don't expect the bundled JSON to overwrite
  a live realm.

## Health check fails / can't reach `/health`

Health and metrics are on the **management port `9000`**, not `8080`.

- Hit `http://<host>:9000/health/ready` from inside the network (it's intentionally
  not proxied to the internet).

## The bootstrap admin can't log in

`KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` only create an account
on the **first** start of a fresh database. If the database already had an admin,
those variables do nothing — use the existing admin, or reset via the admin REST API.

## Database connection errors on startup

- Verify `KC_DB_URL`, `KC_DB_USERNAME`, `KC_DB_PASSWORD` and that Postgres is reachable
  and accepting connections (wait for its healthcheck before Keycloak starts).
- The image is built for Postgres only — don't override `KC_DB`.

## New users aren't prompted for 2FA / passkey questions

2FA enrollment behavior is defined by the `browser-2fa` flow and required actions —
see the 2FA section in [Realm management](realm-management.md), including the
migration note for pre-existing users.
