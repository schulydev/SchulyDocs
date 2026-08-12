# Ambiente di sviluppo

## Prerequisiti

- **SDK .NET 10** - ogni csproj dei plugin ha come target `net10.0`
  (`<TargetFramework>net10.0</TargetFramework>`).
- **Strumenti CLI di EF Core** (`dotnet-ef`) - per i plugin con un `DbContext` (Schulware,
  OdaOrg). Installa/aggiorna con `dotnet tool install --global dotnet-ef` (oppure
  `dotnet tool update`). Vedi [migrations.md](../migrations.md).
- **[Kiota](https://learn.microsoft.com/openapi/kiota/install)** - serve solo per rigenerare il
  client API di Schulware. Vedi [setup/kiota-client.md](kiota-client.md).
- Un **[SchulyBackend](https://github.com/schulydev/SchulyBackend)** attivo con PostgreSQL, per
  caricare e testare un plugin end-to-end.

## La dipendenza dalle abstractions

`Schuly.Plugin.Abstractions` è una **`PackageReference`** NuGet, non un riferimento a progetto:

```xml
<PackageReference Include="Schuly.Plugin.Abstractions" Version="0.2.*" />
```

Fornisce `ISchulyPlugin`, `IPluginBackgroundTask`, `IPluginUserContext`, `IPluginLogin` e
`PluginServiceContext`. I tipi forniti dal backend, come `IPluginVault`
(`Schuly.Infrastructure.Vault`), vengono risolti a runtime dal container DI dell'host - l'host
registra il vault isolato di ogni plugin indicizzandolo tramite il suo `Name`.

## Come è strutturato un plugin

Un plugin è una class library che espone un'implementazione di `ISchulyPlugin` (la composition
root, snella come un `Program.cs` ASP.NET). I plugin più ricchi tengono le route HTTP in
`Controllers/` (scoperte come ApplicationPart MVC) invece di mapparle in `ConfigureEndpoints`, e
suddividono la logica di sincronizzazione in piccoli servizi a scope ridotto, guidati da un
unico `IPluginBackgroundTask`.

Per il ciclo di vita completo vedi [adding-a-plugin.md](../adding-a-plugin.md).

## Compilare un plugin

```sh
# Ripristina + compila un singolo plugin
dotnet build src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release

# Produce l'output caricabile (DLL + dipendenze non fornite dall'host) - stesso comando usato dalla CI
dotnet publish src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release -o ./out
```

Ogni plugin ha anche un file di soluzione `.slnx` per aprirlo in modo autonomo in un IDE.

## Eseguire un plugin contro un backend attivo

L'host dei plugin del backend carica le DLL dei plugin dalla propria cartella `plugins/`
(`/app/plugins/` nel container) e legge la configurazione YAML di ogni plugin dalla propria
cartella di configurazione dei plugin.

1. Avvia SchulyBackend + Postgres (vedi il README del backend).
2. Esegui `dotnet publish` del plugin (sopra) e copia la DLL del plugin insieme alle DLL delle
   sue dipendenze di terze parti nella cartella `plugins/` del backend. Gli assembly condivisi
   dall'host (ASP.NET Core, EF Core, Npgsql, le abstractions, gli assembly host di Schuly) sono
   già forniti dal backend - servono solo le vere dipendenze di terze parti (ad es. Kiota,
   AngleSharp) insieme al plugin.
3. Colloca la configurazione a runtime del plugin come `Schuly.Plugin.<Name>.yml` nella cartella
   di configurazione dei plugin del backend. Per Schulware questa **deve** contenere almeno
   `SchulwareApi.BaseUrl` - altrimenti `ConfigureServices` lancia un'eccezione e rifiuta il
   caricamento (vedi `src/Schuly.Plugin.Schulware/config.yml` per lo schema).
4. Riavvia il backend. All'avvio l'host chiama `ConfigureServices` → `ConfigureEndpoints` →
   `MigrateAsync` (che esegue `db.Database.MigrateAsync()` per creare/aggiornare il database
   Postgres dedicato del plugin), quindi pianifica ogni `IPluginBackgroundTask` secondo il
   proprio `Interval`.

Per la distribuzione reale (scaricare DLL precompilate tramite `curl`) vedi
[setup/distribution.md](distribution.md).
