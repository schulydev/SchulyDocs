# Images und Releases

Auf dieser Seite siehst du, wie die Docker-Images des Servers gebaut und veröffentlicht werden. Die API wird als
Multi-Arch-Image ausgeliefert, gebaut aus `src/Schuly.API/Dockerfile`.

## Container-Image

- **Build-Kontext:** `./src`. Die `COPY`-Pfade im Dockerfile sind relativ dazu, nicht zum Repo-Root.
- **Build-Stufen:** Das Frontend baut mit `oven/bun:1.3.5` und `node:24-slim`, und seine Ausgabe geht nach `wwwroot`. Die
  API baut und veröffentlicht auf `mcr.microsoft.com/dotnet/sdk:10.0`.
- **Laufzeit:** `mcr.microsoft.com/dotnet/aspnet:10.0`. Der Einstiegspunkt ist `dotnet Schuly.API.dll`.
- **Version:** `Directory.Build.props` liest die Version normalerweise aus `application.properties` im Repo-Root, aber diese
  Datei ist nicht im Build-Kontext. Das Image wird stattdessen mit `-p:Version=$VERSION` gebaut, und der Release-Workflow
  übergibt die Release-Version. So bleibt die Assembly-Version des Hosts im Einklang mit dem, woran zur Laufzeit geladene
  Plugins binden.
- **Plugin-Ordner:** Das Image erstellt `/app/plugins` und `/app/plugins-config` für zur Laufzeit geladene Plugins und ihre
  Konfiguration.

## Versionierung und Releases

`application.properties` (`<version>`) ist die einzige Quelle. `src/Directory.Build.props` liest sie.

Das Veröffentlichen eines GitHub-Releases startet `docker-publish-release.yaml`:

1. **`sync-version`:** Vergleicht den Release-Tag ohne sein `v` mit `application.properties`. Wenn sie sich unterscheiden,
   aktualisiert der Job die Datei und führt einen `release-sync/<version>`-Pull-Request per Squash-Merge in `main` zusammen.
2. **`build-and-push-multiarch`:** Baut `linux/amd64` und `linux/arm64` aus `./src` und pusht nach
   `ghcr.io/schulydev/schuly` und `<DOCKERHUB_USERNAME>/schuly`. Der Login-Schritt für Docker Hub ist `continue-on-error`.
3. **`build-and-push-sandbox`:** Baut den Sandbox-Sidecar für `linux/amd64` aus `src/Schuly.Sandbox/Dockerfile` und pusht ihn
   nach `ghcr.io/schulydev/schuly-sandbox`.

Jedes Image erhält die Tags `<semver>`, `<major>.<minor>` und `<major>`, dazu `latest` bei Nicht-Prereleases.

## Migrationen beim Start

Der Container wendet beim Start EF-Core-Migrationen an (`ApplyMigrations()` in `Program.cs` ruft `db.Database.Migrate()` auf)
und befüllt den Schulsystem-Katalog. Beim Deployment brauchst du keinen separaten Migrationsschritt. Stelle sicher, dass der
Connection-String `SchulyDatabase` die Datenbank erreicht. Siehe [Migrationen](../migrations.md) und
[Konfiguration](configuration.md).
