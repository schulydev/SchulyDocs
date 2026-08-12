# Fehlerbehebung

Häufige Probleme, ihre Ursachen und wie du sie behebst.

## Die Login-Seite sieht aus wie Standard-Keycloak (nicht gebrandet)

Das `schuly`-Theme-JAR ist nicht geladen, oder das Realm verwendet es nicht.

- Prüfe, ob das `loginTheme` des Realms `schuly` ist (`realms/schuly-realm.json`).
- Wenn du Theme-Code geändert hast, baue das Image neu - das Theme wird zur
  Build-Zeit eingebacken, nicht zur Laufzeit geladen:
  `docker compose -f compose.dev.yml up --build`. Siehe
  [Theme-Entwicklung](theme-development.md).

## Endlose Weiterleitungen, "HTTPS required" oder falsche URLs im Browser

Keycloak kennt seine öffentliche URL nicht oder vertraut den Proxy-Headern nicht.

- Setze `KC_HOSTNAME` auf die vollständige öffentliche URL (z. B.
  `https://auth.schuly.dev`).
- Setze hinter einem TLS-terminierenden Proxy `KC_PROXY_HEADERS=xforwarded` und
  `KC_HTTP_ENABLED=true`, und stelle sicher, dass der Proxy `X-Forwarded-*`-Header
  weiterleitet.
- Siehe [Den gesamten Stack selbst hosten](setup/self-hosting.md).

## Änderungen an der Realm-JSON zeigen keine Wirkung

Das Realm wird nur beim **ersten** Start importiert; danach bleibt ein bestehendes
Realm unverändert.

- **Lokale Entwicklung:** Setze das Daten-Volume zurück, um erneut zu importieren -
  `docker compose -f compose.dev.yml down -v && docker compose -f compose.dev.yml up --build`.
- **Produktion:** Das Realm existiert bereits in Postgres; nimm Änderungen in der
  Admin-Konsole vor und sichere sie mit dem Export-Skript zurück (siehe
  [Realm-Verwaltung](realm-management.md)). Erwarte nicht, dass die mitgelieferte
  JSON ein laufendes Realm überschreibt.

## Health-Check schlägt fehl / `/health` nicht erreichbar

Health und Metrics liegen auf dem **Management-Port `9000`**, nicht auf `8080`.

- Rufe `http://<host>:9000/health/ready` von innerhalb des Netzwerks auf (er wird
  absichtlich nicht ins Internet proxyt).

## Der Bootstrap-Admin kann sich nicht anmelden

`KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` legen nur beim
**ersten** Start einer frischen Datenbank einen Account an. Hatte die Datenbank
bereits einen Admin, bewirken diese Variablen nichts - verwende den bestehenden
Admin oder setze ihn über die Admin-REST-API zurück.

## Datenbankverbindungsfehler beim Start

- Prüfe `KC_DB_URL`, `KC_DB_USERNAME`, `KC_DB_PASSWORD` und ob Postgres erreichbar
  ist und Verbindungen annimmt (warte auf dessen Healthcheck, bevor Keycloak
  startet).
- Das Image ist ausschliesslich für Postgres gebaut - überschreibe `KC_DB` nicht.

## Neue Nutzer werden nicht nach 2FA / Passkey gefragt

Das Registrierungsverhalten für 2FA wird durch den Flow `browser-2fa` und die
Required Actions bestimmt - siehe den 2FA-Abschnitt in
[Realm-Verwaltung](realm-management.md), einschliesslich des Hinweises zur
Migration für bereits bestehende Nutzer.
