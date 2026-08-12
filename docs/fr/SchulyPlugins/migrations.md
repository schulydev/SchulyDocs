# Migrations EF Core

Les plugins qui persistent des données (Schulware, OdaOrg) gèrent leur schéma via des migrations
EF Core.

## Chaque plugin a sa propre base de données

L'hôte de plugins du backend fournit au plugin une chaîne de connexion dédiée via
`PluginServiceContext.ConnectionString` - il modifie la chaîne de connexion de l'hôte pour que
le nom de la base devienne `schuly_plugin_<name>`. Le plugin la connecte à son `DbContext` :

```csharp
services.AddDbContext<SchulwareDbContext>(o => o.UseNpgsql(context.ConnectionString));
```

Les migrations ne touchent donc jamais la base de données Schuly principale ; le schéma de
chaque plugin est isolé.

## Ajouter une migration

```sh
dotnet ef migrations add <Name> --project src/Schuly.Plugin.Schulware
```

(Remplace le chemin du projet par celui du plugin sur lequel tu travailles.) Cela écrit la
migration dans le dossier `Data/Migrations/` du plugin et met à jour l'instantané du modèle
(model snapshot). Nécessite l'outil `dotnet-ef` - voir
[setup/development.md](setup/development.md).

## Fabrique design-time

`dotnet ef` construit le `DbContext` en design-time sans passer par le pipeline d'injection de
dépendances de l'exécution, donc chaque plugin livre une `IDesignTimeDbContextFactory<T>` à côté
de son `DbContext` (par ex. `Data/SchulwareDbContextFactory.cs`). La chaîne de connexion dans la
fabrique est un espace réservé jetable - les migrations n'ont besoin que du modèle, pas d'une
base de données active :

```csharp
internal sealed class SchulwareDbContextFactory : IDesignTimeDbContextFactory<SchulwareDbContext>
{
    public SchulwareDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<SchulwareDbContext>()
            .UseNpgsql("Host=localhost;Database=schulware_design;Username=postgres;Password=postgres")
            .Options);
}
```

## Appliquer les migrations à l'exécution, pas `EnsureCreated`

Applique les migrations en attente depuis `MigrateAsync` :

```csharp
public async Task MigrateAsync(IServiceProvider sp, CancellationToken ct = default)
{
    using var scope = sp.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<SchulwareDbContext>();
    await db.Database.MigrateAsync(ct);
}
```

**Utilise `MigrateAsync()`, jamais `EnsureCreatedAsync`.** `EnsureCreatedAsync` crée la base de
données au premier lancement, mais ne fait plus rien lors des changements de schéma ultérieurs -
les ajouts de colonnes ou d'index n'arriveraient donc jamais sur une base existante.
`MigrateAsync()` crée la base au premier lancement **et** applique ensuite chaque delta de
schéma.
