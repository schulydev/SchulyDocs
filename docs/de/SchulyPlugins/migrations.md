# EF-Core-Migrationen

Nutze EF-Core-Migrationen, um einem Plugin eine eigene Datenbank zu geben und sein Schema zu ändern. Die Plugins
Schulware und OdaOrg machen das so.

## Jedes Plugin erhält eine eigene Datenbank

Der Host übergibt jedem Plugin einen eigenen Connection-String in `PluginServiceContext.ConnectionString`. Er nimmt den
Haupt-Connection-String und ändert den Datenbanknamen in `schuly_plugin_<name>`. Dabei ist `<name>` der Wert von
`ISchulyPlugin.Name` in Kleinbuchstaben, mit Unterstrichen statt Leerzeichen. Zum Beispiel wird
`Schulware Integration` zu `schuly_plugin_schulware_integration`.

Binde ihn in deinen `DbContext` ein:

```csharp
services.AddDbContext<SchulwareDbContext>(options => options.UseNpgsql(context.ConnectionString));
```

Deine Migrationen berühren die Haupt-Datenbank von Schuly nie.

## Packages hinzufügen

Ein Plugin mit Datenbank referenziert `Microsoft.EntityFrameworkCore`, `Microsoft.EntityFrameworkCore.Design` und
`Npgsql.EntityFrameworkCore.PostgreSQL`. Kopiere die Referenzen aus
[`Schuly.Plugin.OdaOrg.csproj`](https://github.com/schulydev/SchulyPlugins/blob/main/src/Schuly.Plugin.OdaOrg/Schuly.Plugin.OdaOrg.csproj).

## Migration hinzufügen

Du brauchst das Tool `dotnet-ef`. Siehe [Entwicklungsumgebung](setup/development.md).

```sh
dotnet ef migrations add <Name> --project src/Schuly.Plugin.Schulware
```

Ersetze den Projektpfad durch den deines Plugins. Der Befehl schreibt die Migration in den Ordner `Data/Migrations/`
des Plugins und aktualisiert den Modell-Snapshot. Füge bei der ersten Migration eines Plugins
`--output-dir Data/Migrations` hinzu, um denselben Ordner zu nutzen.

## Design-Time-Factory hinzufügen

`dotnet ef` baut den `DbContext` zur Design-Zeit ohne die DI-Pipeline der Laufzeit. Liefere neben deinem `DbContext` eine
`IDesignTimeDbContextFactory<T>` aus, zum Beispiel `Data/SchulwareDbContextFactory.cs`. Ihr Connection-String ist ein
Platzhalter, weil Migrationen nur das Modell brauchen, keine laufende Datenbank:

```csharp
internal sealed class SchulwareDbContextFactory : IDesignTimeDbContextFactory<SchulwareDbContext>
{
    public SchulwareDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<SchulwareDbContext>()
            .UseNpgsql("Host=localhost;Database=schulware_design;Username=postgres;Password=postgres")
            .Options;
        return new SchulwareDbContext(options);
    }
}
```

## Migrationen zur Laufzeit anwenden

Wende ausstehende Migrationen in `MigrateAsync` an. Der Host ruft es bei jedem Laden des Plugins auf.

```csharp
public async Task MigrateAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
{
    using var scope = serviceProvider.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SchulwareDbContext>();
    await db.Database.MigrateAsync(cancellationToken);
}
```

**Nutze `MigrateAsync()`, nie `EnsureCreatedAsync`.** `EnsureCreatedAsync` erstellt die Datenbank beim ersten Lauf,
macht aber bei späteren Schemaänderungen nichts. Neue Spalten und Indizes erreichen eine bestehende Datenbank also nie.
`MigrateAsync()` erstellt die Datenbank beim ersten Lauf und wendet danach jede Schemaänderung an.
