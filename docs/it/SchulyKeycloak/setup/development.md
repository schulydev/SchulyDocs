# Ambiente di sviluppo

Esegui l'intera immagine Schuly Keycloak in locale - tema, blacklist e realm
`schuly` già integrati - usando Docker Compose.

## Prerequisiti

- Docker (con il plugin Compose: `docker compose`).

## Esecuzione

```sh
docker compose -f compose.dev.yml up --build
```

Questo costruisce l'immagine dal `Dockerfile` e avvia Keycloak in modalità
sviluppo (`start-dev --import-realm`).

- Console di amministrazione: <http://localhost:8080>
- Credenziali admin: `admin` / `admin` (impostate tramite
  `KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` in
  `compose.dev.yml`).
- Il realm `schuly` viene importato automaticamente da `./realms` al primo avvio.

La modalità sviluppo usa un database H2 incorporato e persiste i dati nel volume
denominato `keycloak-data-dev`, quindi le modifiche sopravvivono ai riavvii. La
cartella `./realms` è montata in sola lettura su `/opt/keycloak/data/import`, che è
anche dove lo script di export scrive i suoi snapshot (vedi
[Gestione del realm](../realm-management.md)).

## Reimpostare lo stato locale

Per ripartire con un import del realm pulito, elimina il volume dati:

```sh
docker compose -f compose.dev.yml down -v
docker compose -f compose.dev.yml up --build
```
