# Entwicklungsumgebung

Führe das komplette Schuly-Keycloak-Image lokal aus - Theme, Sperrliste und das
`schuly`-Realm bereits eingebacken - mit Docker Compose.

## Voraussetzungen

- Docker (mit dem Compose-Plugin: `docker compose`).

## Ausführen

```sh
docker compose -f compose.dev.yml up --build
```

Das baut das Image aus dem `Dockerfile` und startet Keycloak im Dev-Modus
(`start-dev --import-realm`).

- Admin-Konsole: <http://localhost:8080>
- Admin-Zugangsdaten: `admin` / `admin` (gesetzt über `KC_BOOTSTRAP_ADMIN_USERNAME` /
  `KC_BOOTSTRAP_ADMIN_PASSWORD` in `compose.dev.yml`).
- Das `schuly`-Realm wird beim ersten Start automatisch aus `./realms` importiert.

Der Dev-Modus nutzt eine eingebettete H2-Datenbank und persistiert Daten im
benannten Volume `keycloak-data-dev`, sodass Änderungen Neustarts überstehen. Der
Ordner `./realms` ist schreibgeschützt unter `/opt/keycloak/data/import` gemountet -
dort schreibt auch das Export-Skript seine Snapshots hin (siehe
[Realm-Verwaltung](../realm-management.md)).

## Lokalen Zustand zurücksetzen

Um wieder mit einem sauberen Realm-Import zu starten, lösche das Daten-Volume:

```sh
docker compose -f compose.dev.yml down -v
docker compose -f compose.dev.yml up --build
```
