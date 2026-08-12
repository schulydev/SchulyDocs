# Aggiungere un plugin

## Scheletro

`src/Schuly.Plugin.Example/` - quello che copi - è volutamente minimale:

```
src/Schuly.Plugin.Example/
├── ExamplePlugin.cs                  # implementazione di ISchulyPlugin
├── Schuly.Plugin.Example.csproj
└── Schuly.Plugin.Example.slnx        # apre questo plugin in modo autonomo in un IDE
```

I plugin reali crescono aggiungendo, quando serve, una cartella `Controllers/`, `Data/` (un
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

Registra qui i tuoi servizi, le opzioni, il task in background e il login. `context` espone:

- `context.ConnectionString` - la connection string Postgres dedicata al plugin (l'host la
  modifica per puntare a `schuly_plugin_<name>`; vedi [migrations.md](migrations.md)).
- `context.Configuration` - la configurazione YAML del plugin (`Schuly.Plugin.<Name>.yml`).

Registrazioni tipiche (da Schulware/OdaOrg):

```csharp
services.AddDbContext<MyDbContext>(o => o.UseNpgsql(context.ConnectionString));

services.AddSingleton<MySyncTask>();
services.AddSingleton<IPluginBackgroundTask>(sp => sp.GetRequiredService<MySyncTask>());

// Vault dei segreti in memoria, isolato per plugin, indicizzato dall'host tramite il nome del plugin.
services.AddScoped(sp => new MySecretStore(
    sp.GetRequiredKeyedService<IPluginVault>(MyPlugin.PluginName)));

services.AddScoped<IPluginLogin, MyLogin>();
```

> La chiave del vault deve essere una costante (usata con
> `[FromKeyedServices(PluginName)]`), quindi esponi un `public const string PluginName`. Il
> vault esiste solo in memoria - i segreti **non** sopravvivono a un riavvio del backend, e il
> codice di sincronizzazione deve gestire il caso di vault vuoto ("serve una nuova connessione").

### `ConfigureEndpoints(IEndpointRouteBuilder endpoints)`

Qui si mappano le route in API minimale. Il plugin Example lo usa direttamente:

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
`db.Database.MigrateAsync()`. Il plugin Example (senza database) restituisce semplicemente
`Task.CompletedTask`. Vedi [migrations.md](migrations.md) - usa `MigrateAsync()`, mai
`EnsureCreatedAsync`.

### `IPluginBackgroundTask` (opzionale)

Lavoro ricorrente. Implementa `Name`, `Interval` ed `ExecuteAsync`. Il `PluginBackgroundTaskHost`
del backend invoca `ExecuteAsync` a ogni tick di `Interval`:

```csharp
public class MySyncTask : IPluginBackgroundTask
{
    public string Name => "My Data Sync";
    public TimeSpan Interval => TimeSpan.FromMinutes(30);

    public async Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken ct)
    {
        using var scope = serviceProvider.CreateScope();
        // risolvere i servizi a scope ridotto, eseguire il lavoro
    }
}
```
