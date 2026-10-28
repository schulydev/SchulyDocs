# Produzione

L'API viene distribuita come immagine Docker multi-architettura, costruita a
partire da `src/Schuly.API/Dockerfile`.

## Immagine del container

- **Il contesto di build è `./src`.** I percorsi `COPY` del Dockerfile sono
  relativi a quella directory, non alla radice del repository.
- Fasi di build: build/publish con l'SDK su `mcr.microsoft.com/dotnet/sdk:10.0`,
  runtime su `mcr.microsoft.com/dotnet/aspnet:10.0`. Il punto di ingresso è
  `dotnet Schuly.API.dll`.
- Il file `application.properties` nella radice del repository (che
  `Directory.Build.props` normalmente legge per la versione) **non** è incluso nel
  contesto di build, quindi l'immagine viene costruita con `-p:Version=$VERSION`.
  Il workflow di release passa il tag di release come `VERSION`; questo mantiene
  la versione dell'assembly host allineata con ciò a cui si legano i plugin
  caricati a runtime.
- L'immagine crea in anticipo `/app/plugins` e `/app/plugins-config` per i plugin
  caricati a runtime e la loro configurazione per-plugin.

## Versionamento + release

Unica fonte di verità: **`application.properties`** (`<version>`).
`src/Directory.Build.props` la legge tramite `XmlPeek`.

Pubblicare una GitHub Release attiva `docker-publish-release.yaml`:

1. **`sync-version`** - confronta il tag di release (senza il prefisso `v`) con
   `application.properties`. Se differiscono, apre un branch
   `release-sync/<version>` che aggiorna il file e fa l'auto-merge (squash) della
   PR su `main`.
2. **`build-and-push-multiarch`** - costruisce `linux/amd64` + `linux/arm64` a
   partire da `./src` e pubblica i tag:
   - `ghcr.io/schulydev/schuly:<semver>` più `:<major>`, `:<major>.<minor>` e
     `:latest` (latest solo per le release non preliminari).
   - `<DOCKERHUB_USERNAME>/schuly:<semver>` (Docker Hub, **best-effort** - lo step
     di login è `continue-on-error`).

## Migrazioni all'avvio

Il container applica automaticamente le migrazioni EF Core all'avvio
(`ApplyMigrations()` in `Program.cs` → `db.Database.Migrate()`) e popola il
catalogo dei sistemi scolastici. Non è richiesto alcuno step di migrazione
separato durante il deploy; assicurati solo che il database sia raggiungibile
tramite la stringa di connessione `SchulyDatabase`. Vedi
[Migrazioni](../migrations.md) e [Configurazione](configuration.md).
