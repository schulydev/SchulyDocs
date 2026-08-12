# Documentazione SchulyPlugins

Plugin ufficiali per il [backend Schuly](https://github.com/schulydev/SchulyBackend). Ogni
plugin vive nella propria cartella sotto `src/`, ha come target **.NET 10** e implementa
`ISchulyPlugin` da [`Schuly.Plugin.Abstractions`](https://github.com/schulydev/SchulyPluginAbstractions)
(usato come `PackageReference` NuGet). Il backend carica all'avvio le DLL dei plugin compilati e
ne gestisce il ciclo di vita (`ConfigureServices`, `ConfigureEndpoints`, `MigrateAsync`), oltre a
ogni `IPluginBackgroundTask` ricorrente. I plugin vengono compilati e distribuiti come DLL sul
branch `repo` (distribuzione in stile Aniyomi) e collocati dagli operatori nella cartella
`/app/plugins/` del backend.

## Struttura del repository

| Percorso | Ruolo |
|---|---|
| `src/Schuly.Plugin.Example/` | Plugin di riferimento / scheletro. `ISchulyPlugin` minimale con endpoint in API minimale, route anonime e autorizzate, e una demo di vault dedicato al plugin. |
| `src/Schuly.Plugin.Schulware/` | Integrazione con Schulnetz tramite [SchulwareAPI](https://github.com/schulydev/SchulwareAPI). EF Core + Postgres, client generato con Kiota, task di sincronizzazione in background, controller MVC. |
| `src/Schuly.Plugin.OdaOrg/` | Integrazione con OdaOrg (portale di tirocinio dell'ICT-BBAG). HttpClient + scraper AngleSharp, EF Core + Postgres, task di sincronizzazione in background. |
| `.github/workflows/build_push.yml` | Individua ogni `src/Schuly.Plugin.*/*.csproj`, compila e pubblica DLL + indice sul branch `repo`. |
| `.github/workflows/sync-version-on-release.yml` | Sincronizzazione della versione a ogni release. |

Una cartella di plugin Schulware/OdaOrg è organizzata così:

| Cartella | Contenuto |
|---|---|
| `Controllers/` | Controller ASP.NET MVC - route HTTP (l'host registra l'assembly come ApplicationPart MVC, quindi vengono scoperte automaticamente). |
| `Services/` | Task in background (`IPluginBackgroundTask`) e servizi di sincronizzazione/login a scope ridotto. |
| `Dtos/` / `Models/` | Un record per file. |
| `Data/` | Entità EF Core, `DbContext`, factory design-time e `Migrations/`. |
| `Infrastructure/` | Factory/helper per i client esterni. |
| `Client/` | Client API generato con Kiota (solo Schulware). |
| `config.yml` | Esempio di configurazione a runtime (`Schuly.Plugin.<Name>.yml` nella cartella di configurazione dei plugin del backend). |

## Documenti

| Documento | Contenuto |
|---|---|
| [setup/development.md](setup/development.md) | Prerequisiti, compilazione di un plugin, esecuzione contro un backend attivo. |
| [adding-a-plugin.md](adding-a-plugin.md) | Creazione dello scheletro di un nuovo plugin + il ciclo di vita di `ISchulyPlugin`. |
| [migrations.md](migrations.md) | Migrazioni EF Core per ciascun plugin e il database Postgres dedicato. |
| [setup/kiota-client.md](setup/kiota-client.md) | Rigenerare il client Kiota di Schulware. |
| [setup/distribution.md](setup/distribution.md) | Come i plugin vengono compilati e distribuiti sul branch `repo`. |
| [contributing.md](contributing.md) | Il flusso obbligatorio issue → branch → PR → squash. |
