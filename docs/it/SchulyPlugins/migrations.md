# Migrazioni EF Core

Usa le migrazioni EF Core per dare a un plugin il proprio database e cambiare il suo schema. I plugin Schulware e OdaOrg
fanno così.

## Ogni plugin ha il proprio database

L'host passa a ogni plugin una connection string dedicata in `PluginServiceContext.ConnectionString`.
Prende la connection string principale e cambia il nome del database in `schuly_plugin_<name>`, dove
`<name>` è `ISchulyPlugin.Name` in minuscolo, con gli spazi sostituiti da trattini bassi. Ad esempio,
`Schulware Integration` diventa `schuly_plugin_schulware_integration`.

Collegala al tuo `DbContext`:

```csharp
services.AddDbContext<SchulwareDbContext>(options => options.UseNpgsql(context.ConnectionString));
```

Le tue migrazioni non toccano mai il database principale di Schuly.

## Aggiungi i pacchetti

Un plugin con un database fa riferimento a `Microsoft.EntityFrameworkCore`,
`Microsoft.EntityFrameworkCore.Design` e `Npgsql.EntityFrameworkCore.PostgreSQL`. Copia i
riferimenti da
[`Schuly.Plugin.OdaOrg.csproj`](https://github.com/schulydev/SchulyPlugins/blob/main/src/Schuly.Plugin.OdaOrg/Schuly.Plugin.OdaOrg.csproj).

## Aggiungi una migrazione

Ti serve lo strumento `dotnet-ef`. Vedi [setup di sviluppo](setup/development.md).

```sh
dotnet ef migrations add <Name> --project src/Schuly.Plugin.Schulware
```

Sostituisci il percorso del progetto con quello del tuo plugin. Il comando scrive la migrazione nella cartella
`Data/Migrations/` del plugin e aggiorna lo snapshot del modello. Per la prima migrazione di un plugin, aggiungi
`--output-dir Data/Migrations` per usare la stessa cartella.

## Aggiungi una factory per la fase di design

`dotnet ef` costruisce il `DbContext` in fase di design senza la pipeline DI di runtime. Includi un
`IDesignTimeDbContextFactory<T>` accanto al tuo `DbContext`, come `Data/SchulwareDbContextFactory.cs`.
La sua connection string è un segnaposto, perché le migrazioni hanno bisogno solo del modello, non di un database attivo:

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

## Applica le migrazioni a runtime

Applica le migrazioni in sospeso da `MigrateAsync`. L'host lo chiama ogni volta che carica il plugin.

```csharp
public async Task MigrateAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
{
    using var scope = serviceProvider.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SchulwareDbContext>();
    await db.Database.MigrateAsync(cancellationToken);
}
```

**Usa `MigrateAsync()`, mai `EnsureCreatedAsync`.** `EnsureCreatedAsync` crea il database alla
prima esecuzione ma non fa nulla alle modifiche successive dello schema, quindi nuove colonne e indici non raggiungono mai un
database esistente. `MigrateAsync()` crea il database alla prima esecuzione e applica poi ogni modifica dello schema.
