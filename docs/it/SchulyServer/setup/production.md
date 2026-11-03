# Immagini e release

Usa questa pagina per vedere come vengono create e pubblicate le immagini Docker del server. L'API viene rilasciata come
immagine multi-architettura creata da `src/Schuly.API/Dockerfile`.

## Immagine del container

- **Contesto di build:** `./src`. I percorsi `COPY` del Dockerfile sono relativi a questa directory, non alla radice del repository.
- **Fasi di build:** il frontend viene compilato con `oven/bun:1.3.5` e `node:24-slim`, e il suo output finisce
  in `wwwroot`. L'API viene compilata e pubblicata su `mcr.microsoft.com/dotnet/sdk:10.0`.
- **Runtime:** `mcr.microsoft.com/dotnet/aspnet:10.0`. Il punto di ingresso è `dotnet Schuly.API.dll`.
- **Versione:** `Directory.Build.props` normalmente legge la versione da `application.properties` nella radice del
  repository, ma quel file non è nel contesto di build. L'immagine viene quindi creata con
  `-p:Version=$VERSION`, e il workflow di release passa la versione della release. Questo mantiene la
  versione dell'assembly host allineata con ciò a cui si legano i plugin caricati a runtime.
- **Cartelle dei plugin:** l'immagine crea `/app/plugins` e `/app/plugins-config` per i plugin caricati a runtime
  e la loro configurazione.

## Versionamento e release

`application.properties` (`<version>`) è l'unica fonte di verità. `src/Directory.Build.props` la
legge.

La pubblicazione di una release su GitHub avvia `docker-publish-release.yaml`:

1. **`sync-version`:** confronta il tag della release, senza la sua `v`, con `application.properties`. Se
   differiscono, aggiorna il file e fa lo squash-merge di una pull request `release-sync/<version>` in `main`.
2. **`build-and-push-multiarch`:** crea `linux/amd64` e `linux/arm64` da `./src` e fa il push su
   `ghcr.io/schulydev/schuly` e `<DOCKERHUB_USERNAME>/schuly`. Il passaggio di login su Docker Hub è
   `continue-on-error`.
3. **`build-and-push-sandbox`:** crea il sidecar sandbox per `linux/amd64` da
   `src/Schuly.Sandbox/Dockerfile` e fa il push su `ghcr.io/schulydev/schuly-sandbox`.

Ogni immagine riceve i tag `<semver>`, `<major>.<minor>` e `<major>`, più `latest` per le
versioni che non sono prerelease.

## Migrazioni all'avvio

Il container applica le migrazioni EF Core all'avvio (`ApplyMigrations()` in `Program.cs` chiama
`db.Database.Migrate()`) e inizializza il catalogo dei sistemi scolastici. Non serve un passaggio di migrazione separato
quando fai il deploy. Assicurati che la connection string `SchulyDatabase` possa raggiungere il database. Vedi
[Migrazioni](../migrations.md) e [Configurazione](configuration.md).
