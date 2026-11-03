# Migrations EF Core

Utilise les migrations EF Core pour donner à un plugin sa propre base de données et changer son schéma. Les
plugins Schulware et OdaOrg font cela.

## Chaque plugin a sa propre base de données

L'hôte transmet à chaque plugin une chaîne de connexion dédiée dans `PluginServiceContext.ConnectionString`.
Il prend la chaîne de connexion principale et change le nom de la base de données en
`schuly_plugin_<name>`, où `<name>` est `ISchulyPlugin.Name` en minuscules, avec des tirets bas à la place des
espaces. Par exemple, `Schulware Integration` devient `schuly_plugin_schulware_integration`.

Branche-la dans ton `DbContext` :

```csharp
services.AddDbContext<SchulwareDbContext>(options => options.UseNpgsql(context.ConnectionString));
```

Tes migrations ne touchent jamais à la base de données principale de Schuly.

## Ajouter les packages

Un plugin avec une base de données référence `Microsoft.EntityFrameworkCore`,
`Microsoft.EntityFrameworkCore.Design` et `Npgsql.EntityFrameworkCore.PostgreSQL`. Copie les références depuis
[`Schuly.Plugin.OdaOrg.csproj`](https://github.com/schulydev/SchulyPlugins/blob/main/src/Schuly.Plugin.OdaOrg/Schuly.Plugin.OdaOrg.csproj).

## Ajouter une migration

Il te faut l'outil `dotnet-ef`. Voir [configuration de développement](setup/development.md).

```sh
dotnet ef migrations add <Name> --project src/Schuly.Plugin.Schulware
```

Remplace le chemin du projet par celui de ton plugin. La commande écrit la migration dans le dossier
`Data/Migrations/` du plugin et met à jour le snapshot du modèle. Pour la première migration d'un plugin,
ajoute `--output-dir Data/Migrations` pour utiliser le même dossier.

## Ajouter une fabrique au moment du design

`dotnet ef` construit le `DbContext` au moment du design sans le pipeline DI d'exécution. Fournis une
`IDesignTimeDbContextFactory<T>` à côté de ton `DbContext`, comme `Data/SchulwareDbContextFactory.cs`. Sa
chaîne de connexion est une valeur de remplacement, car les migrations n'ont besoin que du modèle, pas d'une
base de données active :

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

## Appliquer les migrations à l'exécution

Applique les migrations en attente depuis `MigrateAsync`. L'hôte l'appelle à chaque chargement du plugin.

```csharp
public async Task MigrateAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken = default)
{
    using var scope = serviceProvider.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SchulwareDbContext>();
    await db.Database.MigrateAsync(cancellationToken);
}
```

**Utilise `MigrateAsync()`, jamais `EnsureCreatedAsync`.** `EnsureCreatedAsync` crée la base de données à la
première exécution mais ne fait rien lors des changements de schéma suivants, donc les nouvelles colonnes et
les nouveaux index n'atteignent jamais une base de données existante. `MigrateAsync()` crée la base de données
à la première exécution et applique ensuite chaque changement de schéma.
