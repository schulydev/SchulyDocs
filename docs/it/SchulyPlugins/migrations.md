# Migrazioni EF Core

I plugin che persistono dati (Schulware, OdaOrg) gestiscono il proprio schema tramite le
migrazioni EF Core.

## Ogni plugin ha il proprio database

L'host dei plugin del backend fornisce al plugin una connection string dedicata tramite
`PluginServiceContext.ConnectionString` - modifica la connection string dell'host in modo che il
nome del database diventi `schuly_plugin_<name>`. Il plugin la collega al proprio `DbContext`:

```csharp
services.AddDbContext<SchulwareDbContext>(o => o.UseNpgsql(context.ConnectionString));
```

Le migrazioni non toccano quindi mai il database Schuly principale; lo schema di ogni plugin è
isolato.

## Aggiungere una migrazione

```sh
dotnet ef migrations add <Name> --project src/Schuly.Plugin.Schulware
```

(Sostituisci il percorso del progetto con quello del plugin su cui stai lavorando.) Questo scrive
la migrazione nella cartella `Data/Migrations/` del plugin e aggiorna lo snapshot del modello.
Richiede lo strumento `dotnet-ef` - vedi [setup/development.md](setup/development.md).

## Factory design-time

`dotnet ef` costruisce il `DbContext` in fase di design senza la pipeline DI a runtime, quindi
ogni plugin fornisce una `IDesignTimeDbContextFactory<T>` accanto al proprio `DbContext`
(ad es. `Data/SchulwareDbContextFactory.cs`). La connection string nella factory è un
segnaposto usa e getta - le migrazioni hanno bisogno solo del modello, non di un database attivo:

```csharp
internal sealed class SchulwareDbContextFactory : IDesignTimeDbContextFactory<SchulwareDbContext>
{
    public SchulwareDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<SchulwareDbContext>()
            .UseNpgsql("Host=localhost;Database=schulware_design;Username=postgres;Password=postgres")
            .Options);
}
```

## Applicare le migrazioni a runtime, non `EnsureCreated`

Applica le migrazioni in sospeso da `MigrateAsync`:

```csharp
public async Task MigrateAsync(IServiceProvider sp, CancellationToken ct = default)
{
    using var scope = sp.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SchulwareDbContext>();
    await db.Database.MigrateAsync(ct);
}
```

**Usa `MigrateAsync()`, mai `EnsureCreatedAsync`.** `EnsureCreatedAsync` crea il database alla
prima esecuzione, ma non fa nulla ai successivi cambi di schema, quindi aggiunte di colonne o
indici non arriverebbero mai su un database esistente. `MigrateAsync()` crea il DB alla prima
esecuzione **e** applica in seguito ogni delta di schema.
