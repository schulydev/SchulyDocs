# Ein Plugin hinzufügen

## Gerüst

`src/Schuly.Plugin.Example/` - die Vorlage, die du kopierst - ist bewusst minimal gehalten:

```
src/Schuly.Plugin.Example/
├── ExamplePlugin.cs                  # ISchulyPlugin-Implementierung
├── Schuly.Plugin.Example.csproj
└── Schuly.Plugin.Example.slnx        # öffnet dieses Plugin eigenständig in einer IDE
```

Echte Plugins bekommen bei Bedarf einen `Controllers/`-, `Data/`- (ein `DbContext` + EF-Migrationen)
und `Services/`-Ordner dazu - schau dir `src/Schuly.Plugin.Schulware/` oder
`src/Schuly.Plugin.OdaOrg/` an, um zu sehen, wie das aussieht, sobald ein Plugin mit einer
Datenbank und einer externen API spricht. Nichts davon ist zum Start nötig.

1. Kopiere `src/Schuly.Plugin.Example/` nach `src/Schuly.Plugin.<Name>/`:

   ```
   src/Schuly.Plugin.<Name>/
   ├── <Name>Plugin.cs
   ├── Schuly.Plugin.<Name>.csproj
   └── Schuly.Plugin.<Name>.slnx
   ```

2. Benenne `ExamplePlugin.cs` → `<Name>Plugin.cs` um; benenne Klasse und Namespace entsprechend um.
   Die Klasse implementiert `ISchulyPlugin`.
3. Benenne die `.csproj` (und `.slnx`) in `Schuly.Plugin.<Name>` um. Behalte
   `<TargetFramework>net10.0</TargetFramework>` und die `PackageReference` auf
   `Schuly.Plugin.Abstractions` bei. Setze `<Version>`, `<Description>`, `<Authors>` - diese
   Angaben fliessen in den veröffentlichten Distributions-Index ein.
4. Eröffne ein Issue mit dem Label `new-plugin` und folge anschliessend dem
   [Contributing-Workflow](contributing.md): Branch → PR (`Closes #<issue>`) → Squash-Merge.

Es ist keine Workflow-Änderung nötig - `build_push.yml` findet automatisch jedes
`src/Schuly.Plugin.*/*.csproj`. Siehe [setup/distribution.md](setup/distribution.md).

## Der `ISchulyPlugin`-Lebenszyklus

Die Plugin-Klasse ist die Composition Root (schlank, wie eine `Program.cs`). Der Plugin-Host des
Backends ruft beim Start in dieser Reihenfolge auf:

### `ConfigureServices(IServiceCollection services, PluginServiceContext context)`

Registriere hier deine Services, Optionen, den Hintergrund-Task und den Login. `context` stellt
bereit:

- `context.ConnectionString` - der dedizierte Postgres-Connection-String des Plugins
  (der Host wandelt ihn auf `schuly_plugin_<name>` ab; siehe [migrations.md](migrations.md)).
- `context.Configuration` - die YAML-Konfiguration des Plugins (`Schuly.Plugin.<Name>.yml`).

Typische Registrierungen (aus Schulware/OdaOrg):

```csharp
services.AddDbContext<MyDbContext>(o => o.UseNpgsql(context.ConnectionString));

services.AddSingleton<MySyncTask>();
services.AddSingleton<IPluginBackgroundTask>(sp => sp.GetRequiredService<MySyncTask>());

// Pro Plugin isoliertes, In-Memory-Secret-Vault, vom Host über den Plugin-Namen als Key registriert.
services.AddScoped(sp => new MySecretStore(
    sp.GetRequiredKeyedService<IPluginVault>(MyPlugin.PluginName)));

services.AddScoped<IPluginLogin, MyLogin>();
```

> Der Vault-Key muss eine Konstante sein (verwendet mit `[FromKeyedServices(PluginName)]`), stelle
> also ein `public const string PluginName` bereit. Das Vault liegt nur im Arbeitsspeicher -
> Secrets überleben einen Backend-Neustart **nicht**, und der Sync-Code muss den Fall eines leeren
> Vaults ("erneute Verbindung nötig") abfangen.

### `ConfigureEndpoints(IEndpointRouteBuilder endpoints)`

Hier werden Minimal-API-Routen gemappt. Das Example-Plugin nutzt das direkt:

```csharp
endpoints.MapGet("/api/plugins/example/hello",
    (IPluginUserContext userContext) => Results.Ok(...)).RequireAuthorization();
endpoints.MapGet("/api/plugins/example/info", () => Results.Ok(...)).AllowAnonymous();
```

Die Plugins Schulware und OdaOrg lassen das stattdessen leer und legen ihre Routen als
ASP.NET-MVC-Controller in `Controllers/` ab - der Host registriert die Plugin-Assembly als
MVC-ApplicationPart, sodass `[ApiController]`-Controller automatisch erkannt werden. Beide Wege
funktionieren; Controller skalieren bei grösseren Oberflächen besser.

### `MigrateAsync(IServiceProvider serviceProvider, CancellationToken)`

Wende hier die EF-Core-Migrationen an. Löse den `DbContext` aus einem Scope auf und rufe
`db.Database.MigrateAsync()` auf. Das Example-Plugin (ohne DB) gibt einfach `Task.CompletedTask`
zurück. Siehe [migrations.md](migrations.md) - verwende `MigrateAsync()`, niemals
`EnsureCreatedAsync`.

### `IPluginBackgroundTask` (optional)

Wiederkehrende Arbeit. Implementiere `Name`, `Interval` und `ExecuteAsync`. Der
`PluginBackgroundTaskHost` des Backends ruft `ExecuteAsync` bei jedem `Interval`-Tick auf:

```csharp
public class MySyncTask : IPluginBackgroundTask
{
    public string Name => "My Data Sync";
    public TimeSpan Interval => TimeSpan.FromMinutes(30);

    public async Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken ct)
    {
        using var scope = serviceProvider.CreateScope();
        // gescopte Services auflösen, Arbeit erledigen
    }
}
```
