# Development setup

Run the full Schuly Keycloak image locally - theme, blacklist, and the `schuly`
realm all baked in - using Docker Compose.

## Prerequisites

- Docker (with the Compose plugin: `docker compose`).

## Run

```sh
docker compose -f compose.dev.yml up --build
```

This builds the image from the `Dockerfile` and starts Keycloak in dev mode
(`start-dev --import-realm`).

- Admin console: <http://localhost:8080>
- Admin credentials: `admin` / `admin` (set via `KC_BOOTSTRAP_ADMIN_USERNAME` /
  `KC_BOOTSTRAP_ADMIN_PASSWORD` in `compose.dev.yml`).
- The `schuly` realm is imported automatically from `./realms` on first start.

Dev mode uses an embedded H2 database and persists data in the `keycloak-data-dev`
named volume, so changes survive restarts. The `./realms` folder is mounted
read-only at `/opt/keycloak/data/import`, which is also where the export script
writes snapshots (see [Realm management](../realm-management.md)).

## Reset local state

To start from a clean realm import again, drop the data volume:

```sh
docker compose -f compose.dev.yml down -v
docker compose -f compose.dev.yml up --build
```
