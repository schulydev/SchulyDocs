# EF-Core-Migrationen

Plugins, die Daten persistieren (Schulware, OdaOrg), verwalten ihr Schema über
EF-Core-Migrationen.

## Jedes Plugin bekommt seine eigene Datenbank

Der Plugin-Host des Backends übergibt dem Plugin einen dedizierten Connection-String über
`PluginServiceContext.ConnectionString` - er wandelt den Host-Connection-String so ab, dass der
Datenbankname zu `schuly_plugin_<name>` wird. Das Plugin verdrahtet ihn mit seinem `DbContext`:

```csharp
services.AddDbContext<SchulwareDbContext>(o => o.UseNpgsql(context.ConnectionString));
```

Migrationen berühren die Haupt-Schuly-Datenbank also nie; das Schema jedes Plugins ist isoliert.

## Eine Migration hinzufügen

```sh
dotnet ef migrations add <Name> --project src/Schuly.Plugin.Schulware
```

(Passe den Projektpfad an das Plugin an, an dem du arbeitest.) Das schreibt die Migration in den
`Data/Migrations/`-Ordner des Plugins und aktualisiert den Model-Snapshot. Dafür wird das Tool
`dotnet-ef` benötigt - siehe [setup/development.md](setup/development.md).

## Design-Time-Factory

`dotnet ef` erzeugt den `DbContext` zur Design-Zeit ohne die Laufzeit-DI-Pipeline, daher liefert
jedes Plugin neben seinem `DbContext` eine `IDesignTimeDbContextFactory<T>` aus
(z. B. `Data/SchulwareDbContextFactory.cs`). Der Connection-String in der Factory ist ein
Wegwerf-Platzhalter - Migrationen brauchen nur das Modell, keine lebende Datenbank:

```csharp
internal sealed class SchulwareDbContextFactory : IDesignTimeDbContextFactory<SchulwareDbContext>
{
    public SchulwareDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<SchulwareDbContext>()
            .UseNpgsql("Host=localhost;Database=schulware_design;Username=postgres;Password=postgres")
            .Options);
}
```

## Migrationen zur Laufzeit anwenden, nicht `EnsureCreated`

Wende ausstehende Migrationen aus `MigrateAsync` heraus an:

```csharp
public async Task MigrateAsync(IServiceProvider sp, CancellationToken ct = default)
{
    using var scope = sp.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SchulwareDbContext>();
    await db.Database.MigrateAsync(ct);
}
```

**Verwende `MigrateAsync()`, niemals `EnsureCreatedAsync`.** `EnsureCreatedAsync` legt die
Datenbank beim ersten Start an, tut bei späteren Schemaänderungen aber nichts mehr - Spalten- oder
Indexergänzungen würden also nie auf einer bestehenden Datenbank ankommen. `MigrateAsync()` legt
die DB beim ersten Start an **und** wendet danach jedes Schema-Delta an.
