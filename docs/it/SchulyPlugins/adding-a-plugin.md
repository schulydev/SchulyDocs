# Aggiungere un plugin

## Scheletro

`src/Schuly.Plugin.Example/` - quello che copi - è volutamente minimale:

```
src/Schuly.Plugin.Example/
├── ExamplePlugin.cs                  # ISchulyPlugin implementation
├── Schuly.Plugin.Example.csproj
└── Schuly.Plugin.Example.slnx        # opens this plugin standalone in an IDE
```

I plugin reali aggiungono, quando serve, una cartella `Controllers/`, `Data/` (un
`DbContext` + migrazioni EF) e `Services/` - guarda `src/Schuly.Plugin.Schulware/` o
`src/Schuly.Plugin.OdaOrg/` per vedere come si presenta un plugin che dialoga con un database e
un'API esterna. Nulla di tutto ciò è necessario per iniziare.

1. Copia `src/Schuly.Plugin.Example/` in `src/Schuly.Plugin.<Name>/`:

   ```
   src/Schuly.Plugin.<Name>/
   ├── <Name>Plugin.cs
   ├── Schuly.Plugin.<Name>.csproj
   └── Schuly.Plugin.<Name>.slnx
   ```

2. Rinomina `ExamplePlugin.cs` → `<Name>Plugin.cs`; rinomina la classe e il namespace di
   conseguenza. La classe implementa `ISchulyPlugin`.
3. Rinomina il `.csproj` (e lo `.slnx`) in `Schuly.Plugin.<Name>`. Mantieni
   `<TargetFramework>net10.0</TargetFramework>` e la `PackageReference` a
   `Schuly.Plugin.Abstractions`. Imposta `<Version>`, `<Description>`, `<Authors>` - questi dati
   confluiscono nell'indice di distribuzione pubblicato.
4. Apri una issue con etichetta `new-plugin`, poi segui il
   [flusso di contribuzione](contributing.md): branch → PR (`Closes #<issue>`) → squash-merge.

Non serve alcuna modifica al workflow - `build_push.yml` individua automaticamente ogni
`src/Schuly.Plugin.*/*.csproj`. Vedi [setup/distribution.md](setup/distribution.md).

## Il ciclo di vita di `ISchulyPlugin`

La classe del plugin è la composition root (snella, come un `Program.cs`). L'host dei plugin del
backend, all'avvio, invoca questi metodi in ordine:

### `ConfigureServices(IServiceCollection services, PluginServiceContext context)`

Registra i tuoi servizi, le opzioni, il task in background e il login. `context` espone:

- `context.ConnectionString` - la connection string Postgres dedicata al plugin (l'host la
  modifica per puntare a `schuly_plugin_<name>`; vedi [migrations.md](migrations.md)).
- `context.Configuration` - la configurazione YAML del plugin (`Schuly.Plugin.<Name>.yml`).

Registrazioni tipiche (da Schulware/OdaOrg):

```csharp
services.AddDbContext<MyDbContext>(o => o.UseNpgsql(context.ConnectionString));

services.AddSingleton<MySyncTask>();
services.AddSingleton<IPluginBackgroundTask>(sp => sp.GetRequiredService<MySyncTask>());

// Takes the plugin's own IPluginVault, which the host registers.
services.AddScoped<MySecretStore>();

services.AddScoped<IPluginLogin, MyLogin>();
```

L'host registra questi servizi del contratto nel container di ogni plugin. Iniettali, mai
i tipi propri del backend:

| Servizio | Usalo per |
|---|---|
| `ISchoolData` | Predisporre la scuola e lo studente, poi sincronizzare agenda, voti, assenze e documenti |
| `IPluginVault` | Conservare token e credenziali, cifrati, nel namespace proprio del plugin |
| `IPluginFileStore` | Salvare un file scaricato (ad es. una pagella) e ottenere la sua chiave |
| `IPluginUserContext` | Leggere l'utente corrente durante una richiesta di login |

Il codice di sincronizzazione crea semplici record e li passa a `ISchoolData`. Assegna a ogni record un
`ExternalId` stabile (`Shared/ExternalIds.cs`) e converti prima in UTC gli orari locali del provider
(`Shared/SwissTime.cs` per i sistemi svizzeri). Il backend salva solo UTC.

```csharp
var records = lessons.Select(l => new AgendaRecord(ExternalIds.Of("lesson", l.Start.ToString("O"), l.Course), AgendaKind.Lesson, l.Title, l.Start, l.End, l.Room)).ToList();
await schoolData.SyncAgendaAsync(account.SchoolUserId!.Value, records, ct);
```

### `ConfigureEndpoints(IEndpointRouteBuilder endpoints)`

Mappa qui le route in API minimale. Il plugin Example lo usa direttamente:

```csharp
endpoints.MapGet("/api/plugins/example/hello",
    (IPluginUserContext userContext) => Results.Ok(...)).RequireAuthorization();
endpoints.MapGet("/api/plugins/example/info", () => Results.Ok(...)).AllowAnonymous();
```

I plugin Schulware e OdaOrg lasciano invece questo metodo vuoto e mettono le route in
`Controllers/` come controller ASP.NET MVC - l'host registra l'assembly del plugin come
ApplicationPart MVC, quindi i controller `[ApiController]` vengono scoperti automaticamente.
Entrambi gli approcci funzionano; i controller si adattano meglio a superfici più ampie.

### `MigrateAsync(IServiceProvider serviceProvider, CancellationToken)`

Applica le migrazioni EF Core. Risolvi il `DbContext` da uno scope e chiama
`db.Database.MigrateAsync()`. Il plugin Example (senza database) restituisce
`Task.CompletedTask`. Vedi [migrations.md](migrations.md) - usa `MigrateAsync()`, mai
`EnsureCreatedAsync`.

### `IPluginBackgroundTask` (opzionale)

Lavoro ricorrente. Implementa `Name`, `Schedule` ed `ExecuteAsync`. Il `PluginBackgroundTaskHost`
del backend invoca `ExecuteAsync` con la cadenza dichiarata da `Schedule`:

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
