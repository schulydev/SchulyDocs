# Konfigurationsreferenz

Alles, was sich am Schuly-Keycloak-Image konfigurieren lässt, an einem Ort. Das Image
ist ein **optimierter** Keycloak-26.6-Build - Datenbank-Vendor, Health- und
Metrics-Endpunkte sind also bereits zur Build-Zeit eingebacken. Zur Laufzeit gibst du
im Wesentlichen nur die Datenbankverbindung, den öffentlichen Hostnamen und einen
Bootstrap-Admin an.

## Ports

| Port | Zweck | Öffentlich freigeben? |
|---|---|---|
| `8080` | HTTP - Login-Seiten, OIDC-/SAML-Endpunkte, Admin-Konsole, Admin-REST-API. | Ja, über deinen Reverse Proxy (der TLS terminiert). |
| `9000` | Management - `/health`, `/health/ready`, `/health/live`, `/metrics`. | **Nein.** Intern halten; niemals ins Internet proxyen. |

## Umgebungsvariablen zur Laufzeit

Setze diese am Container (z. B. `environment:` in Compose oder `-e` bei `docker run`).

| Variable | Erforderlich | Zweck |
|---|---|---|
| `KC_DB_URL` | Ja | JDBC-URL der Postgres-Datenbank, z. B. `jdbc:postgresql://db:5432/keycloak`. |
| `KC_DB_USERNAME` | Ja | Datenbank-Benutzer. |
| `KC_DB_PASSWORD` | Ja | Datenbank-Passwort. |
| `KC_HOSTNAME` | Ja (prod) | Öffentliche URL, unter der Keycloak ausgeliefert wird, z. B. `https://auth.schuly.dev`. Keycloak baut daraus alle Issuer-/Redirect-URLs. |
| `KC_PROXY_HEADERS` | Ja (hinter einem Proxy) | Auf `xforwarded` setzen, wenn ein Reverse Proxy TLS terminiert und `X-Forwarded-*`-Header weiterleitet (`forwarded` verwenden, falls er den RFC-7239-Header `Forwarded` sendet). |
| `KC_HTTP_ENABLED` | Ja (hinter einem Proxy) | `true`, damit das Backend auf `8080` einfaches HTTP ausliefert, während der Proxy HTTPS übernimmt. |
| `KC_BOOTSTRAP_ADMIN_USERNAME` | nur beim ersten Start | Temporärer Bootstrap-Admin-Benutzername. Einmalig verwenden, um einen echten Admin anzulegen, danach entfernen. |
| `KC_BOOTSTRAP_ADMIN_PASSWORD` | nur beim ersten Start | Temporäres Bootstrap-Admin-Passwort. |
| `KC_HTTP_PORT` | - | HTTP-Port überschreiben (Standard `8080`). |
| `KC_LOG_LEVEL` | - | Root-Log-Level (z. B. `info`, `debug`). |

> Setze `KC_DB` nicht - das Image ist für Postgres gebaut. Den Vendor umzustellen
> würde einen neuen Build des optimierten Images erfordern.

## SMTP (Realm-E-Mail)

Der Mailserver des `schuly`-Realms wird beim Start aus der Container-Umgebung
befüllt - das Realm liefert `${env.SMTP_*}`-Platzhalter, die
`scripts/resolve-realm-env.sh` vor dem Import auflöst. Lässt du sie ungesetzt, wird
das Realm ohne funktionierenden Mailserver importiert - das ist unproblematisch, bis
du verifizierte E-Mails oder die Self-Service-Passwort-Zurücksetzung brauchst.

| Variable | Erforderlich | Zweck |
|---|---|---|
| `SMTP_HOST` | für Mail | Hostname des Mailservers. |
| `SMTP_PORT` | für Mail | Port des Mailservers, z. B. `587`. |
| `SMTP_FROM` | - | Absenderadresse. Standardmässig `noreply@localhost`; setze eine echte Adresse, bevor du Mail aktivierst. |
| `SMTP_USER` | für Mail | SMTP-Benutzername (das Realm sendet `auth: true`). |
| `SMTP_PASSWORD` | für Mail | SMTP-Passwort. |
| `SMTP_SSL` | - | `true` für implizites TLS. |
| `SMTP_STARTTLS` | - | `true` für STARTTLS. |

> Diese gelten nur beim **ersten** Start, wenn das Realm importiert wird. Änderungen
> danach wirken sich nicht auf ein bestehendes Realm aus - passe die Mail-Einstellungen
> stattdessen in der Admin-Konsole an (**Realm-Einstellungen → E-Mail**).

## Fest eingebackene Build-Einstellungen

Diese sind zur Image-Build-Zeit (`kc.sh build`) fixiert und werden in der Regel nicht
zur Laufzeit geändert:

| Einstellung | Wert | Wo |
|---|---|---|
| Datenbank-Vendor | `KC_DB=postgres` | `Dockerfile` (Builder-Stage) |
| Health-Endpunkte | `KC_HEALTH_ENABLED=true` | `Dockerfile` (Builder-Stage) |
| Metrics-Endpunkt | `KC_METRICS_ENABLED=true` | `Dockerfile` (Builder-Stage) |
| Start-Kommando | `start --optimized --import-realm` | `Dockerfile` (`CMD`) |
| Pfad der Passwort-Sperrliste | `JAVA_OPTS_APPEND=-Dkeycloak.password.blacklists.path=…` | `Dockerfile` (`ENV`) |

## Fest eingebackenes Verhalten

- **Realm-Import** - das `schuly`-Realm wird beim **ersten** Start importiert. Bei
  späteren Starts bleibt ein bestehendes Realm unangetastet. Siehe
  [Realm-Verwaltung](realm-management.md).
- **Sperrliste geleakter Passwörter** - die rockyou-Liste liegt unter
  `/opt/keycloak/password-blacklists/rockyou.txt`; die Passwort-Policy des Realms
  nutzt `passwordBlacklist(rockyou.txt)`.
- **Login-Theme** - das Keycloakify-Theme `schuly` ist als Provider-JAR installiert
  und wird vom Realm ausgewählt (`loginTheme: "schuly"`). Siehe
  [Theme-Entwicklung](theme-development.md).

## Volumes

Im Produktivbetrieb (Postgres) liegt der gesamte Zustand in der Datenbank, es ist
also **kein Volume erforderlich**. Die Realm-Importdateien sind im Image unter
`/opt/keycloak/data/import` eingebacken.

Die lokale Entwicklung ist anders: Sie verwendet eine eingebettete H2-Datenbank, die
im benannten Volume `keycloak-data-dev` persistiert wird - siehe
[Entwicklungsumgebung](setup/development.md).
