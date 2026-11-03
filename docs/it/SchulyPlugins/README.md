# SchulyPlugins

Usa queste pagine per creare, testare e rilasciare plugin per il
[server Schuly](https://github.com/schulydev/SchulyServer).

| Pagina | Usala per |
|---|---|
| [Aggiungi un plugin](adding-a-plugin.md) | Passare da una copia del plugin di esempio a un plugin caricato |
| [Setup di sviluppo](setup/development.md) | Installare gli strumenti, compilare un plugin ed eseguirlo su un server locale |
| [Migrazioni EF Core](migrations.md) | Dare a un plugin il proprio database e far evolvere il suo schema |
| [Client Kiota](setup/kiota-client.md) | Rigenerare il client API di Schulware |
| [Distribuzione](setup/distribution.md) | Vedere come i plugin vengono compilati e rilasciati sul branch `repo` |
| [Come contribuire](contributing.md) | Seguire le regole di questo repository |

## Come funzionano i plugin

Ogni plugin si trova nella propria cartella sotto `src/`, ha come target .NET 10 e implementa `ISchulyPlugin` da
[`Schuly.Plugin.Abstractions`](https://github.com/schulydev/SchulyPluginAbstractions), un `PackageReference`
NuGet.

La CI compila ogni plugin e pubblica le DLL sul branch `repo` (distribuzione in stile Aniyomi). Il
server scarica i plugin elencati nel suo `plugins.yml` e li carica all'avvio. Chiama
`ConfigureServices`, `MigrateAsync` e `ConfigureEndpoints`, poi pianifica ogni
`IPluginBackgroundTask` ricorrente.

## Struttura del repository

| Percorso | Ruolo |
|---|---|
| `src/Schuly.Plugin.Example/` | Plugin di riferimento da copiare. Un `ISchulyPlugin` minimo con endpoint minimal API, route anonime e autorizzate e una demo del vault per plugin. |
| `src/Schuly.Plugin.Schulware/` | Integrazione con Schulnetz tramite [SchulwareAPI](https://github.com/schulydev/SchulwareAPI). EF Core e Postgres, un client generato con Kiota, un task di sincronizzazione in background e controller MVC. |
| `src/Schuly.Plugin.OdaOrg/` | Integrazione con OdaOrg (portale di apprendistato ICT-BBAG). Uno scraper con HttpClient e AngleSharp, EF Core e Postgres e un task di sincronizzazione in background. |
| `src/Schuly.Plugin.Microsoft/` | Microsoft 365 tramite il servizio [SchulyMicrosoft](https://github.com/schulydev/SchulyMicrosoft). Collega un account Microsoft e legge e scrive dati di mail, calendario, OneDrive, Teams e OneNote. Non ha un database proprio. |
| `src/Shared/` | Helper compilati nei plugin che li richiedono: `ExternalIds`, `SwissTime`, `DataUri` e `Provisioning/InstanceUrl`. |
| `tests/` | `Schuly.Plugin.Microsoft.Tests` e `Schuly.Plugins.Linking.Tests`. |
| `.github/workflows/build_push.yml` | Trova ogni progetto di plugin, lo compila e pubblica le DLL e l'indice sul branch `repo`. |
| `.github/workflows/sync-docs.yml` | Copia `docs/` sul sito della documentazione. |

## Dentro la cartella di un plugin

I plugin Schulware e OdaOrg usano queste cartelle. Il plugin Microsoft usa `Controllers/`,
`Services/` e `Infrastructure/`.

| Cartella | Contenuto |
|---|---|
| `Controllers/` | Controller ASP.NET MVC con le route HTTP. L'host registra l'assembly come ApplicationPart MVC, quindi li trova automaticamente. |
| `Services/` | Il task in background (`IPluginBackgroundTask`) e piccoli servizi scoped di sincronizzazione e login. |
| `Dtos/` (Schulware), `Models/` (OdaOrg) | Record. In `Dtos/`, un record per file. |
| `Data/` | Entità EF Core, `DbContext`, factory per la fase di design e `Migrations/`. |
| `Infrastructure/` | Factory e helper per i client esterni. |
| `Client/` | Client API generato con Kiota (solo Schulware). |
| `config.yml` | Esempio di configurazione a runtime. Distribuiscilo come `Schuly.Plugin.<Name>.yml` nella cartella di configurazione dei plugin del server. |
