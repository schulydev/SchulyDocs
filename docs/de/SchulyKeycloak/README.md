# SchulyKeycloak-Dokumentation

Schulys eigenes [Keycloak](https://www.keycloak.org/)-Image - der produktive Identity
Provider für Schuly. Der Container bringt ein [Keycloakify](https://keycloakify.dev)
-Login-Theme (als Provider-JAR), eine Sperrliste geleakter Passwörter (rockyou) und
das `schuly`-Realm bereits mit und wird als *optimierter* Keycloak-Build ausgeliefert,
damit der Produktivstart schnell geht. Releases pushen ein Multi-Arch-Image nach
`ghcr.io/schulydev/schulykeycloak`.

## Dokuindex

**Erste Schritte**
- [Entwicklungsumgebung](setup/development.md) - das Image lokal mit Docker Compose ausführen.
- [Den gesamten Stack selbst hosten](setup/self-hosting.md) - Keycloak + Postgres + einen TLS-Proxy produktiv betreiben.

**Anleitungen**
- [Produktivbetrieb](setup/production.md) - das optimierte Image gegen eine Postgres-DB ausführen.
- [Realm-Verwaltung](realm-management.md) - das `schuly`-Realm bearbeiten und sichern (inkl. 2FA).
- [Theme-Entwicklung](theme-development.md) - am Keycloakify-Login-Theme arbeiten.
- [Account- vs. Privatmodus](account-vs-privacy-mode.md) - wie Nutzer sich anmelden.
- [Release](setup/release.md) - ein Release schneiden und Images veröffentlichen.
- [Contributing](contributing.md) - der Issue-→-Branch-→-PR-Workflow.

**Referenz & Hintergrund**
- [Konfigurationsreferenz](configuration.md) - jeder Port, jede Umgebungsvariable und jeder Default.
- [Architektur](architecture.md) - wie Theme, Realm und Basis-Image zusammenspielen, und der Login-Ablauf.
- [Fehlerbehebung](troubleshooting.md) - Symptome, Ursachen und Lösungen.

## Repository-Struktur

Nur relevant, wenn du am Image selbst etwas änderst.

| Pfad | Zweck |
|---|---|
| `Dockerfile` | Mehrstufiger Build: Theme-JAR → rockyou-Sperrliste → optimiertes Keycloak 26.6 → Runtime-Image. |
| `keycloakify/` | Das gebrandete Login-Theme (Keycloakify 11, React + Tailwind + shadcn). Wird beim Image-Build in ein Provider-JAR gebaut. |
| `realms/schuly-realm.json` | Das `schuly`-Realm (Rollen, Gruppen, Client-Scopes, 2FA-Browser-Flow). Wird beim ersten Start importiert. |
| `compose.dev.yml` | Lokale Entwicklung: `start-dev --import-realm`, admin/admin auf `:8080`. |
| `scripts/keycloak-export.{sh,ps1,bat}` | Realm-Änderungen aus dem laufenden Container zurück nach `realms/` übertragen. |
| `.github/workflows/docker-publish-release.yaml` | Baut und pusht das Multi-Arch-Image bei einem GitHub-Release. |
| `application.properties` | Single Source of Truth für die Version; CI synchronisiert sie mit dem Release-Tag. |
