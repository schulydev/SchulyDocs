# Server betreiben und aktualisieren

Alltägliche Aufgaben für einen Server, den du mit [Schuly selbst hosten](self-hosting.md) eingerichtet
hast. Führe Befehle im Ordner `deploy` aus.

## Sichern

Alle Daten liegen in `deploy/data`. Sichere diese Elemente:

- `data/postgres`: Konten und Schuldaten
- `data/seaweedfs`: Dokumente und Profilbilder
- `.env`: die Schlüssel. Ohne sie lassen sich Teile der Sicherung nicht lesen.

## Aktualisieren

1. Sichere `data/postgres`.
2. Setze die neue `SCHULY_VERSION` in `.env`.
3. Führe `docker compose -f compose.staging.yml up -d` aus.

Schuly aktualisiert seine Datenbank beim Start. Um die Version zu prüfen, öffne
`https://<your domain>/api/app` und lies das Feld `version`.

## Alle Daten löschen

Stoppe den Stack und lösche dann den Ordner `data`:

```sh
docker compose -f compose.staging.yml down
rm -rf data
```

## Wie lange Daten aufbewahrt werden

Einmal täglich entfernt Schuly abgelaufene Daten:

| Daten | Entfernt nach | Einstellung |
|---|---|---|
| Schuldaten einer Person, die die Schule verlassen hat | 6 Monate nach dem Austrittsdatum | `Retention__MonthsAfterLeave` |
| Schuly-Daten eines inaktiven Kontos | 12 Monate ohne Anfrage | `Retention__MonthsInactive` |

Ändere diese Werte in `config/backend.env` oder schalte die Bereinigung mit `Retention__Enabled` aus.
Das Anmeldekonto bleibt bestehen. Wessen Daten abgelaufen sind, kann sich also anmelden und wieder
synchronisieren.

Wenn Benutzer ihr Konto löschen, löscht Schuly ihre Schuldaten, Dokumente und Anmeldedaten sofort.

## Von Keycloak wechseln

Ältere Server nutzten einen separaten Keycloak-Container. Passwörter lassen sich nicht übernehmen.
Bestehende Benutzer müssen sich also neu registrieren oder ihr Passwort zurücksetzen.

1. Füge die neuen Schlüssel aus `.env.example` zu `.env` hinzu.
2. Entferne `AUTH_HOST`, `KEYCLOAK_VERSION` und alle `KC_*`-Variablen.
3. Übernimm die aktuelle `compose.staging.yml`, das aktuelle `Caddyfile` und den aktuellen Ordner `config` aus dem Repository.
