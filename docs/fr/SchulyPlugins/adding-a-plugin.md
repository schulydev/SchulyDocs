# Ajouter un plugin

## Gabarit

`src/Schuly.Plugin.Example/` - celui que tu copies - est volontairement minimal :

```
src/Schuly.Plugin.Example/
├── ExamplePlugin.cs                  # ISchulyPlugin implementation
├── Schuly.Plugin.Example.csproj
└── Schuly.Plugin.Example.slnx        # opens this plugin standalone in an IDE
```

Les vrais plugins gagnent un dossier `Controllers/`, `Data/` (un `DbContext` + des migrations EF)
et `Services/` selon leurs besoins - regarde `src/Schuly.Plugin.Schulware/`
ou `src/Schuly.Plugin.OdaOrg/` pour voir à quoi ça ressemble une fois qu'un plugin dialogue avec
une base de données et une API externe. Rien de tout cela n'est requis pour démarrer.

1. Copie `src/Schuly.Plugin.Example/` vers `src/Schuly.Plugin.<Name>/` :

   ```
   src/Schuly.Plugin.<Name>/
   ├── <Name>Plugin.cs
   ├── Schuly.Plugin.<Name>.csproj
   └── Schuly.Plugin.<Name>.slnx
   ```

2. Renomme `ExamplePlugin.cs` → `<Name>Plugin.cs` ; renomme la classe et le namespace en
   conséquence. La classe implémente `ISchulyPlugin`.
3. Renomme le `.csproj` (et le `.slnx`) en `Schuly.Plugin.<Name>`. Conserve
   `<TargetFramework>net10.0</TargetFramework>` et la `PackageReference` vers
   `Schuly.Plugin.Abstractions`. Renseigne `<Version>`, `<Description>`, `<Authors>` - ces
   informations alimentent l'index de distribution publié.
4. Ouvre une issue étiquetée `new-plugin`, puis suis le
   [processus de contribution](contributing.md) : branche → PR (`Closes #<issue>`) →
   squash-merge.

Aucun changement de workflow n'est nécessaire - `build_push.yml` détecte automatiquement tout
`src/Schuly.Plugin.*/*.csproj`. Voir [setup/distribution.md](setup/distribution.md).

## Le cycle de vie `ISchulyPlugin`

La classe du plugin est la racine de composition (compacte, comme un `Program.cs`). L'hôte de
plugins du backend appelle les méthodes suivantes dans cet ordre au démarrage :

### `ConfigureServices(IServiceCollection services, PluginServiceContext context)`

Enregistre tes services, options, la tâche en arrière-plan et le login. `context` expose :

- `context.ConnectionString` - la chaîne de connexion Postgres dédiée au plugin (l'hôte la
  modifie pour cibler `schuly_plugin_<name>` ; voir [migrations.md](migrations.md)).
- `context.Configuration` - la configuration YAML du plugin (`Schuly.Plugin.<Name>.yml`).

Enregistrements typiques (tirés de Schulware/OdaOrg) :

```csharp
services.AddDbContext<MyDbContext>(o => o.UseNpgsql(context.ConnectionString));

services.AddSingleton<MySyncTask>();
services.AddSingleton<IPluginBackgroundTask>(sp => sp.GetRequiredService<MySyncTask>());

// Takes the plugin's own IPluginVault, which the host registers.
services.AddScoped<MySecretStore>();

services.AddScoped<IPluginLogin, MyLogin>();
```

L'hôte enregistre ces services du contrat dans le conteneur de chaque plugin. Injecte-les, jamais
les types propres au backend :

| Service | Utilise-le pour |
|---|---|
| `ISchoolData` | Provisionner l'école et l'élève, puis synchroniser l'agenda, les notes, les absences et les documents |
| `IPluginVault` | Conserver les tokens et les identifiants, chiffrés, dans l'espace de noms propre au plugin |
| `IPluginFileStore` | Stocker un fichier téléchargé (par ex. un bulletin) et obtenir sa clé |
| `IPluginUserContext` | Lire l'utilisateur courant pendant une requête de login |

Le code de synchronisation construit de simples records et les transmet à `ISchoolData`. Donne à chaque record un
`ExternalId` stable (`Shared/ExternalIds.cs`) et convertis d'abord les heures locales du fournisseur en UTC
(`Shared/SwissTime.cs` pour les systèmes suisses). Le backend ne stocke que de l'UTC.

```csharp
var records = lessons.Select(l => new AgendaRecord(ExternalIds.Of("lesson", l.Start.ToString("O"), l.Course), AgendaKind.Lesson, l.Title, l.Start, l.End, l.Room)).ToList();
await schoolData.SyncAgendaAsync(account.SchoolUserId!.Value, records, ct);
```

### `ConfigureEndpoints(IEndpointRouteBuilder endpoints)`

Mappe ici les routes en API minimale. Le plugin Example l'utilise directement :

```csharp
endpoints.MapGet("/api/plugins/example/hello",
    (IPluginUserContext userContext) => Results.Ok(...)).RequireAuthorization();
endpoints.MapGet("/api/plugins/example/info", () => Results.Ok(...)).AllowAnonymous();
```

Les plugins Schulware et OdaOrg laissent plutôt cette méthode vide et placent leurs routes dans
`Controllers/` sous forme de contrôleurs ASP.NET MVC - l'hôte enregistre l'assembly du plugin
comme ApplicationPart MVC, donc les contrôleurs `[ApiController]` sont découverts
automatiquement. Les deux approches fonctionnent ; les contrôleurs passent mieux à l'échelle
pour des surfaces plus vastes.

### `MigrateAsync(IServiceProvider serviceProvider, CancellationToken)`

Applique les migrations EF Core. Résous le `DbContext` depuis un scope et appelle
`db.Database.MigrateAsync()`. Le plugin Example (sans base de données) retourne
`Task.CompletedTask`. Voir [migrations.md](migrations.md) - utilise `MigrateAsync()`, jamais
`EnsureCreatedAsync`.

### `IPluginBackgroundTask` (optionnel)

Travail récurrent. Implémente `Name`, `Schedule` et `ExecuteAsync`. Le `PluginBackgroundTaskHost`
du backend invoque `ExecuteAsync` à la cadence déclarée par `Schedule` :

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
