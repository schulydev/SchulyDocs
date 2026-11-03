# Aggiungi un plugin

Questa guida ti porta da una copia del plugin di esempio a un plugin caricato dal tuo server locale, poi
lo rilascia. Prima di iniziare, [prepara il tuo ambiente](setup/development.md).

## 1. Copia l'esempio

[`src/Schuly.Plugin.Example/`](https://github.com/schulydev/SchulyPlugins/tree/main/src/Schuly.Plugin.Example)
è volutamente minimo:

```
src/Schuly.Plugin.Example/
├── ExamplePlugin.cs                  # ISchulyPlugin implementation
├── Schuly.Plugin.Example.csproj
└── Schuly.Plugin.Example.slnx        # opens this plugin standalone in an IDE
```

1. Copia la cartella in `src/Schuly.Plugin.<Name>/`.
2. Rinomina `ExamplePlugin.cs` in `<Name>Plugin.cs`. Rinomina di conseguenza la classe e il namespace. La classe
   implementa `ISchulyPlugin`.
3. Rinomina `.csproj` e `.slnx` in `Schuly.Plugin.<Name>`, e aggiorna il percorso del progetto all'interno del
   `.slnx`.

Ottieni questo:

```
src/Schuly.Plugin.<Name>/
├── <Name>Plugin.cs
├── Schuly.Plugin.<Name>.csproj
└── Schuly.Plugin.<Name>.slnx
```

I plugin reali aggiungono `Controllers/`, `Data/` (un `DbContext` e le migrazioni EF) e `Services/` quando
servono. Niente di tutto questo è necessario per iniziare. Per vedere come appare, leggi
[`Schuly.Plugin.Schulware`](https://github.com/schulydev/SchulyPlugins/tree/main/src/Schuly.Plugin.Schulware)
o [`Schuly.Plugin.OdaOrg`](https://github.com/schulydev/SchulyPlugins/tree/main/src/Schuly.Plugin.OdaOrg).

## 2. Imposta le proprietà del progetto

Nel `.csproj`:

1. Mantieni `<TargetFramework>net10.0</TargetFramework>` e il `PackageReference` di
   `Schuly.Plugin.Abstractions`.
2. Imposta `<Version>`, `<Description>` e `<Authors>`. Finiscono nell'indice pubblicato.
3. Per usare gli helper condivisi in `src/Shared/` (namespace `Schuly.Plugin.Shared`), includili nella compilazione:

   ```xml
   <ItemGroup>
     <Compile Include="..\Shared\**\*.cs" />
   </ItemGroup>
   ```

## 3. Implementa la classe del plugin

La classe del plugin è la composition root, snella come un `Program.cs`. L'host la crea con
`Activator.CreateInstance`, quindi le serve un costruttore pubblico senza parametri.

Scegli `Name` con attenzione e tienilo stabile. L'host ne ricava il nome del database del plugin, il namespace del
vault e il prefisso d'ambiente `SCHULY_PLUGIN_<NAME>_`.

Quando carica un plugin, l'host chiama questi membri in quest'ordine:

1. `ConfigureServices`
2. `MigrateAsync`
3. `ConfigureEndpoints`

Poi registra i tuoi controller, pianifica i tuoi task in background e aggiunge il tuo sistema scolastico al
catalogo.

### `ConfigureServices(IServiceCollection services, PluginServiceContext context)`

Registra i tuoi servizi, le opzioni, il task in background e il login. Ogni plugin ha il proprio container di
servizi. `context` ti dà:

- `context.ConnectionString`: il database Postgres proprio del plugin. Vedi [migrazioni](migrations.md).
- `context.Configuration`: la configurazione dell'host, con sopra il file `Schuly.Plugin.<Name>.yml` del plugin e le
  variabili d'ambiente `SCHULY_PLUGIN_<NAME>_`.

Registrazioni tipiche, da Schulware e OdaOrg:

```csharp
services.AddDbContext<MyDbContext>(o => o.UseNpgsql(context.ConnectionString));

services.AddSingleton<MySyncTask>();
services.AddSingleton<IPluginBackgroundTask>(sp => sp.GetRequiredService<MySyncTask>());

// Takes the plugin's own IPluginVault, which the host registers.
services.AddScoped<MySecretStore>();

services.AddScoped<IPluginLogin, MyLogin>();
```

L'host registra questi servizi del contratto nel container di ogni plugin. Iniettali, mai i tipi propri del
backend. L'host rifiuta di caricare un plugin che fa riferimento a un assembly del backend.

| Servizio | Usalo per |
|---|---|
| `ISchoolData` | Creare la scuola e lo studente, poi sincronizzare agenda, note, esami, assenze, documenti e pagelle semestrali |
| `IPluginVault` | Conservare token e credenziali, cifrati, nel namespace proprio del plugin |
| `IPluginFileStore` | Salvare un file scaricato, come una pagella, e ottenere la sua chiave |
| `IPluginUserContext` | Leggere l'utente corrente durante una richiesta di login |
| `ILinkedAccounts` | Leggere e salvare gli account che un utente ha collegato con un provider esterno, condivisi da tutti i plugin |

L'host fornisce anche `ILogger<T>`, `IHttpClientFactory`, `IHttpContextAccessor` e `IConfiguration`.

### `MigrateAsync(IServiceProvider serviceProvider, CancellationToken)`

Applica le migrazioni EF Core. Risolvi il `DbContext` da uno scope e chiama
`db.Database.MigrateAsync()`. Usa `MigrateAsync()`, mai `EnsureCreatedAsync`. Vedi
[migrazioni](migrations.md).

Un plugin senza database, come il plugin Example, restituisce `Task.CompletedTask`.

### `ConfigureEndpoints(IEndpointRouteBuilder endpoints)`

Mappa qui le route minimal API. Il plugin Example fa così:

```csharp
endpoints.MapGet("/api/plugins/example/hello", () =>
{
    return Results.Ok(new { Message = "Hello from the Example Plugin!", Plugin = Name, Version });
}).RequireAuthorization();

endpoints.MapGet("/api/plugins/example/info", () =>
{
    return Results.Ok(new { Name, Version, Description = "A sample plugin demonstrating the Schuly plugin system." });
}).AllowAnonymous();
```

Oppure lascia vuoto questo metodo e metti le tue route in `Controllers/`, come fanno i plugin Schulware, OdaOrg e
Microsoft. L'host registra l'assembly del plugin come ApplicationPart MVC, quindi trova automaticamente
i controller `[ApiController]`. Entrambi gli approcci funzionano. I controller scalano meglio per superfici più
grandi.

## 4. Aggiungi funzioni

Aggiungi le parti che servono al tuo plugin. Il [riferimento del contratto](/it/SchulyPluginAbstractions/contract) elenca
ogni interfaccia e record.

### Permetti agli utenti di collegare un account

Implementa `IPluginLogin` e registralo. Il suo descrittore `SchoolSystem` è ciò che fa comparire il tuo sistema scolastico
nell'app.

### Sincronizza i dati scolastici

Costruisci record semplici e passali a `ISchoolData`:

- Dai a ogni record un `ExternalId` stabile (`src/Shared/ExternalIds.cs`).
- Prima converti in UTC gli orari locali del provider (`src/Shared/SwissTime.cs` per i sistemi svizzeri). Il
  backend memorizza solo UTC.

```csharp
var records = lessons.Select(l => new AgendaRecord(ExternalIds.Of("lesson", l.Start.ToString("O"), l.Course), AgendaKind.Lesson, l.Title, l.Start, l.End, l.Room)).ToList();
await schoolData.SyncAgendaAsync(account.SchoolUserId!.Value, records, ct);
```

### Esegui lavoro ricorrente

Implementa `IPluginBackgroundTask`: `Name`, `Schedule` e `ExecuteAsync`. L'host esegue `ExecuteAsync`
secondo lo `Schedule`. Gli operatori sovrascrivono una pianificazione in base al `Name` del task, quindi tieni stabile il nome.

```csharp
public class MySyncTask : IPluginBackgroundTask
{
    public string Name => "My Data Sync";
    public PluginSchedule Schedule => PluginSchedule.Every(TimeSpan.FromMinutes(30));

    public async Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken ct)
    {
        using var scope = serviceProvider.CreateScope();
        // resolve scoped services, do work
    }
}
```

## 5. Caricalo sul tuo server locale

1. Segui [Esegui un plugin su un server locale](setup/development.md#esegui-un-plugin-su-un-server-locale).
2. Cerca `Loaded plugin <your plugin name> v<version>` nel log del server. Se il caricamento non riesce, il log
   contiene `Failed to load plugin` e il motivo.
3. Chiama una delle tue route per confermare che risponde.

## 6. Rilascialo

1. Apri un issue con l'etichetta `new-plugin`, poi segui il [flusso di lavoro condiviso](/it/contribute/).
2. Fai il merge in `main`. `build_push.yml` trova automaticamente ogni `src/Schuly.Plugin.*/*.csproj`, quindi
   non modifichi nessun workflow. Vedi [distribuzione](setup/distribution.md).
3. Per installare il plugin pubblicato, aggiungilo al `plugins.yml` del server. Vedi
   [Gestione dei plugin](/it/SchulyServer/plugin-management).
