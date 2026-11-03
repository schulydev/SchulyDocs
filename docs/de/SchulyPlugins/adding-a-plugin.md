# Plugin hinzufügen

Diese Anleitung führt dich von einer Kopie des Beispiel-Plugins zu einem Plugin, das dein lokaler Server lädt, und
liefert es dann aus. [Richte zuerst deine Umgebung ein](setup/development.md).

## 1. Beispiel kopieren

[`src/Schuly.Plugin.Example/`](https://github.com/schulydev/SchulyPlugins/tree/main/src/Schuly.Plugin.Example)
ist absichtlich minimal:

```
src/Schuly.Plugin.Example/
├── ExamplePlugin.cs                  # ISchulyPlugin implementation
├── Schuly.Plugin.Example.csproj
└── Schuly.Plugin.Example.slnx        # opens this plugin standalone in an IDE
```

1. Kopiere den Ordner nach `src/Schuly.Plugin.<Name>/`.
2. Benenne `ExamplePlugin.cs` in `<Name>Plugin.cs` um. Benenne die Klasse und den Namespace passend dazu um. Die
   Klasse implementiert `ISchulyPlugin`.
3. Benenne `.csproj` und `.slnx` in `Schuly.Plugin.<Name>` um und aktualisiere den Projektpfad in der `.slnx`.

Das Ergebnis:

```
src/Schuly.Plugin.<Name>/
├── <Name>Plugin.cs
├── Schuly.Plugin.<Name>.csproj
└── Schuly.Plugin.<Name>.slnx
```

Echte Plugins fügen bei Bedarf `Controllers/`, `Data/` (ein `DbContext` und EF-Migrationen) und `Services/` hinzu.
Nichts davon ist für den Start nötig. Wie das aussieht, zeigen
[`Schuly.Plugin.Schulware`](https://github.com/schulydev/SchulyPlugins/tree/main/src/Schuly.Plugin.Schulware)
und [`Schuly.Plugin.OdaOrg`](https://github.com/schulydev/SchulyPlugins/tree/main/src/Schuly.Plugin.OdaOrg).

## 2. Projekteigenschaften setzen

In der `.csproj`:

1. Behalte `<TargetFramework>net10.0</TargetFramework>` und die `PackageReference` auf
   `Schuly.Plugin.Abstractions`.
2. Setze `<Version>`, `<Description>` und `<Authors>`. Sie landen im veröffentlichten Index.
3. Um die gemeinsamen Helfer in `src/Shared/` (Namespace `Schuly.Plugin.Shared`) zu nutzen, kompiliere sie ein:

   ```xml
   <ItemGroup>
     <Compile Include="..\Shared\**\*.cs" />
   </ItemGroup>
   ```

## 3. Plugin-Klasse implementieren

Die Plugin-Klasse ist der Composition Root, schlank wie eine `Program.cs`. Der Host erstellt sie mit
`Activator.CreateInstance`. Sie braucht deshalb einen öffentlichen, parameterlosen Konstruktor.

Wähle `Name` sorgfältig und halte ihn stabil. Der Host leitet daraus den Datenbanknamen, den Vault-Namespace und das
Umgebungspräfix `SCHULY_PLUGIN_<NAME>_` des Plugins ab.

Beim Laden eines Plugins ruft der Host diese Members in dieser Reihenfolge auf:

1. `ConfigureServices`
2. `MigrateAsync`
3. `ConfigureEndpoints`

Danach registriert er deine Controller, plant deine Hintergrund-Tasks ein und nimmt dein Schulsystem in den Katalog
auf.

### `ConfigureServices(IServiceCollection services, PluginServiceContext context)`

Registriere deine Services, Options, deinen Hintergrund-Task und deinen Login. Jedes Plugin hat einen eigenen
Service-Container. `context` gibt dir:

- `context.ConnectionString`: die eigene Postgres-Datenbank des Plugins. Siehe [Migrationen](migrations.md).
- `context.Configuration`: die Host-Konfiguration, überlagert mit der `Schuly.Plugin.<Name>.yml` des Plugins und den
  Umgebungsvariablen `SCHULY_PLUGIN_<NAME>_`.

Typische Registrierungen aus Schulware und OdaOrg:

```csharp
services.AddDbContext<MyDbContext>(o => o.UseNpgsql(context.ConnectionString));

services.AddSingleton<MySyncTask>();
services.AddSingleton<IPluginBackgroundTask>(sp => sp.GetRequiredService<MySyncTask>());

// Takes the plugin's own IPluginVault, which the host registers.
services.AddScoped<MySecretStore>();

services.AddScoped<IPluginLogin, MyLogin>();
```

Der Host registriert diese Vertrags-Services im Container jedes Plugins. Injiziere sie, nie die eigenen Typen des
Backends. Der Host weigert sich, ein Plugin zu laden, das eine Backend-Assembly referenziert.

| Service | Nutze ihn, um |
|---|---|
| `ISchoolData` | die Schule und die lernende Person anzulegen und dann Agenda, Noten, Prüfungen, Absenzen, Dokumente und Semesterberichte zu synchronisieren |
| `IPluginVault` | Tokens und Zugangsdaten verschlüsselt im eigenen Namespace des Plugins aufzubewahren |
| `IPluginFileStore` | eine heruntergeladene Datei, zum Beispiel ein Zeugnis, zu speichern und ihren Schlüssel zu erhalten |
| `IPluginUserContext` | den aktuellen User während einer Login-Anfrage zu lesen |
| `ILinkedAccounts` | Konten zu lesen und zu speichern, die ein User bei einem externen Provider verknüpft hat, von allen Plugins gemeinsam genutzt |

Der Host stellt auch `ILogger<T>`, `IHttpClientFactory`, `IHttpContextAccessor` und `IConfiguration` bereit.

### `MigrateAsync(IServiceProvider serviceProvider, CancellationToken)`

Wende EF-Core-Migrationen an. Löse den `DbContext` aus einem Scope auf und rufe `db.Database.MigrateAsync()` auf.
Nutze `MigrateAsync()`, nie `EnsureCreatedAsync`. Siehe [Migrationen](migrations.md).

Ein Plugin ohne Datenbank, zum Beispiel das Example-Plugin, gibt `Task.CompletedTask` zurück.

### `ConfigureEndpoints(IEndpointRouteBuilder endpoints)`

Registriere hier Minimal-API-Routen. Das Example-Plugin macht das so:

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

Oder lass diese Methode leer und lege deine Routen in `Controllers/` ab, wie es die Plugins Schulware, OdaOrg und
Microsoft tun. Der Host registriert die Plugin-Assembly als MVC-ApplicationPart und findet `[ApiController]`-Controller
deshalb automatisch. Beide Ansätze funktionieren. Controller skalieren bei grösseren Oberflächen besser.

## 4. Funktionen hinzufügen

Füge die Teile hinzu, die dein Plugin braucht. Die [Vertragsreferenz](/de/SchulyPluginAbstractions/contract) listet
jedes Interface und Record auf.

### User ein Konto verbinden lassen

Implementiere `IPluginLogin` und registriere es. Sein `SchoolSystem`-Descriptor sorgt dafür, dass dein Schulsystem in
der App erscheint.

### Schuldaten synchronisieren

Baue schlichte Records und übergib sie an `ISchoolData`:

- Gib jedem Record eine stabile `ExternalId` (`src/Shared/ExternalIds.cs`).
- Wandle Ortszeiten des Providers zuerst in UTC um (`src/Shared/SwissTime.cs` für Schweizer Systeme). Das Backend
  speichert nur UTC.

```csharp
var records = lessons.Select(l => new AgendaRecord(ExternalIds.Of("lesson", l.Start.ToString("O"), l.Course), AgendaKind.Lesson, l.Title, l.Start, l.End, l.Room)).ToList();
await schoolData.SyncAgendaAsync(account.SchoolUserId!.Value, records, ct);
```

### Wiederkehrende Arbeit ausführen

Implementiere `IPluginBackgroundTask`: `Name`, `Schedule` und `ExecuteAsync`. Der Host führt `ExecuteAsync` nach dem
`Schedule` aus. Betreiber überschreiben einen Schedule über den `Name` des Tasks. Halte den Namen deshalb stabil.

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

## 5. Auf deinem lokalen Server laden

1. Folge [Plugin auf einem lokalen Server starten](setup/development.md#plugin-auf-einem-lokalen-server-starten).
2. Suche im Server-Log nach `Loaded plugin <your plugin name> v<version>`. Schlägt das Laden fehl, enthält das Log
   `Failed to load plugin` und den Grund.
3. Rufe eine deiner Routen auf, um zu prüfen, dass sie antwortet.

## 6. Ausliefern

1. Eröffne ein Issue mit dem Label `new-plugin` und folge dann dem [gemeinsamen Workflow](/de/contribute/).
2. Führe nach `main` zusammen. `build_push.yml` findet jede `src/Schuly.Plugin.*/*.csproj` automatisch. Du änderst
   also keinen Workflow. Siehe [Distribution](setup/distribution.md).
3. Um das veröffentlichte Plugin zu installieren, füge es zur `plugins.yml` des Servers hinzu. Siehe
   [Plugin-Verwaltung](/de/SchulyServer/plugin-management).
