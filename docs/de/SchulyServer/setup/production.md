# Produktion

Die API wird als Multi-Arch-Docker-Image ausgeliefert, gebaut aus
`src/Schuly.API/Dockerfile`.

## Container-Image

- **Der Build-Kontext ist `./src`.** Die `COPY`-Pfade im Dockerfile sind relativ
  zu diesem Verzeichnis, nicht zur Repo-Wurzel.
- Build-Stages: SDK-Build/Publish auf `mcr.microsoft.com/dotnet/sdk:10.0`,
  Runtime auf `mcr.microsoft.com/dotnet/aspnet:10.0`. Einstiegspunkt ist
  `dotnet Schuly.API.dll`.
- Die `application.properties` im Repo-Root (die `Directory.Build.props`
  normalerweise für die Version ausliest) ist **nicht** im Build-Kontext
  enthalten, daher wird das Image mit `-p:Version=$VERSION` gebaut. Der
  Release-Workflow übergibt den Release-Tag als `VERSION`; das hält die
  Assembly-Version des Hosts konsistent mit dem, wogegen zur Laufzeit geladene
  Plugins binden.
- Das Image legt `/app/plugins` und `/app/plugins-config` für zur Laufzeit
  geladene Plugins und deren Konfiguration pro Plugin vorab an.

## Versionierung + Release

Einzige Quelle der Wahrheit: **`application.properties`** (`<version>`).
`src/Directory.Build.props` liest sie über `XmlPeek` aus.

Das Veröffentlichen eines GitHub Release löst `docker-publish-release.yaml`
aus:

1. **`sync-version`** - vergleicht den Release-Tag (ohne führendes `v`) mit
   `application.properties`. Bei Abweichung wird ein Branch
   `release-sync/<version>` mit aktualisierter Datei erstellt und der PR
   automatisch (squash) in `main` gemergt.
2. **`build-and-push-multiarch`** - baut `linux/amd64` + `linux/arm64` aus
   `./src` und pusht folgende Tags:
   - `ghcr.io/schulydev/schuly:<semver>` sowie `:<major>`,
     `:<major>.<minor>` und `:latest` (`latest` nur für Nicht-Prereleases).
   - `<DOCKERHUB_USERNAME>/schuly:<semver>` (Docker Hub, **best-effort** - der
     Login-Schritt ist `continue-on-error`).

## Migrationen beim Start

Der Container wendet EF-Core-Migrationen automatisch beim Start an
(`ApplyMigrations()` in `Program.cs` → `db.Database.Migrate()`) und spielt den
School-Systems-Katalog ein. Beim Deployment ist kein separater
Migrationsschritt nötig; stelle nur sicher, dass die Datenbank über den
`SchulyDatabase`-Connection-String erreichbar ist. Siehe
[Migrationen](../migrations.md) und [Konfiguration](configuration.md).
