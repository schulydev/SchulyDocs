# Setup di sviluppo

Usa questa pagina per installare gli strumenti, compilare un plugin ed eseguirlo su un server locale.

## Prerequisiti

- **.NET 10 SDK.** Ogni csproj di plugin ha come target `net10.0`.
- **Strumenti CLI di EF Core** (`dotnet-ef`), per i plugin con un `DbContext` (Schulware, OdaOrg). Vedi
  [migrazioni](../migrations.md).

  ```sh
  dotnet tool install --global dotnet-ef
  dotnet tool update --global dotnet-ef
  ```

- **[Kiota](https://learn.microsoft.com/openapi/kiota/install)**, per rigenerare il client API di
  Schulware. Vedi [Client Kiota](kiota-client.md).
- Un **[SchulyServer](/it/SchulyServer/setup/development)** in esecuzione con PostgreSQL, per caricare e testare un
  plugin da capo a fondo.

## La dipendenza dalle astrazioni

`Schuly.Plugin.Abstractions` è un `PackageReference` NuGet, non un riferimento a un progetto:

```xml
<PackageReference Include="Schuly.Plugin.Abstractions" Version="0.11.*" />
```

Fornisce l'intero contratto, inclusi `ISchulyPlugin`, `IPluginBackgroundTask`,
`IPluginUserContext`, `IPluginLogin`, `ISchoolData` e i suoi record, `IPluginVault`, `IPluginFileStore`,
`ILinkedAccounts`, `ILinkProvider` e `PluginServiceContext`. Vedi il
[riferimento del contratto](/it/SchulyPluginAbstractions/contract).

I plugin non fanno riferimento a nulla del backend. L'host registra le implementazioni dei servizi nel container di ogni
plugin a runtime.

Il backend rifiuta di caricare un plugin compilato per una versione incompatibile del contratto. Prima della 1.0, questo
significa un MAJOR.MINOR diverso. Il workflow di pubblicazione registra la versione come `contract` in `index.json`, così
il backend non si aggiorna mai a una build che non può caricare. Vedi
[versionamento](/it/SchulyPluginAbstractions/versioning).

## Come è strutturato un plugin

Un plugin è una libreria di classi con un'unica implementazione di `ISchulyPlugin`, la composition root. I plugin più
grandi tengono le route HTTP in `Controllers/`, scoperte come ApplicationPart MVC, invece di mapparle
in `ConfigureEndpoints`. Dividono la logica di sincronizzazione in piccoli servizi scoped guidati da un unico
`IPluginBackgroundTask`.

Vedi [Aggiungi un plugin](../adding-a-plugin.md) per il ciclo di vita completo.

## Compila un plugin

```sh
# Restore and build one plugin
dotnet build src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release

# Produce the loadable output (the same command CI uses)
dotnet publish src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release -o ./out
```

I plugin Example e Schulware hanno anche un file `.slnx`, che apre il plugin da solo in un IDE.

## Esegui un plugin su un server locale

Il server carica un plugin solo se è elencato in `plugins.yml` e ha un manifest nella cartella dei plugin.
Rimuove i plugin installati che non sono elencati.

Questi percorsi sono relativi alla cartella dell'app del server, `<app>`. Con `dotnet run`, è la cartella di output della build
di `Schuly.API`. Nel container, è `/app`.

| File | Predefinito | Impostazione |
|---|---|---|
| Elenco dei plugin | `<app>/plugins.yml` | `Plugins:File` |
| DLL e manifest dei plugin | `<app>/plugins/` | `Plugins:Directory` |
| Configurazione dei plugin | `<app>/plugins-config/` | `Plugins:ConfigDirectory` |

1. Avvia SchulyServer e Postgres. Vedi il
   [setup di sviluppo](/it/SchulyServer/setup/development) del server.
2. Esegui `dotnet publish` come mostrato sopra.
3. Copia `out/Schuly.Plugin.<Name>.dll` e le DLL delle sue dipendenze di terze parti, come Kiota o AngleSharp,
   nella cartella dei plugin. Lascia fuori ciò che fornisce il server: `Microsoft.AspNetCore.*`,
   `Microsoft.Extensions.*`, `Microsoft.EntityFrameworkCore.*`, `Npgsql.*`, `Mediator.*` e
   `Schuly.Plugin.Abstractions.dll`.
4. Nella cartella dei plugin, crea il manifest `Schuly.Plugin.<Name>.plugin.json`. Elenca in `files` ogni file che
   hai copiato:

   ```json
   {
     "name": "Schuly.Plugin.<Name>",
     "version": "1.0.0",
     "dll": "Schuly.Plugin.<Name>.dll",
     "files": ["Schuly.Plugin.<Name>.dll"]
   }
   ```

5. Aggiungi il plugin a `plugins.yml` con la stessa versione del manifest. Se la versione è diversa e il
   plugin è anche nel registro, il server sostituisce la tua build con quella del registro.

   ```yaml
   plugins:
     - name: Schuly.Plugin.<Name>
       version: 1.0.0
   ```

6. Se il plugin ha bisogno di configurazione, salvala come `Schuly.Plugin.<Name>.yml` (o `.yaml`) nella cartella
   di configurazione dei plugin.
   - Schulware richiede `SchulwareApi.BaseUrl`. Vedi
     [`config.yml`](https://github.com/schulydev/SchulyPlugins/blob/main/src/Schuly.Plugin.Schulware/config.yml)
     per lo schema.
   - Microsoft richiede `MicrosoftApi.BaseUrl`.

   Senza il valore obbligatorio, `ConfigureServices` del plugin lancia un'eccezione e il plugin non viene caricato.
7. Riavvia il server.

All'avvio, l'host chiama `ConfigureServices`, poi `MigrateAsync`, che crea o aggiorna il
database Postgres del plugin, poi `ConfigureEndpoints`. Quindi pianifica ogni `IPluginBackgroundTask` secondo il
suo `Schedule`.

Per vedere come vengono pubblicati i plugin, leggi [distribuzione](distribution.md).
