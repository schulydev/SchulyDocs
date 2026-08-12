# Ajouter un plugin

## Gabarit

`src/Schuly.Plugin.Example/` - celui que tu copies - est volontairement minimal :

```
src/Schuly.Plugin.Example/
├── ExamplePlugin.cs                  # implémentation de ISchulyPlugin
├── Schuly.Plugin.Example.csproj
└── Schuly.Plugin.Example.slnx        # ouvre ce plugin de manière autonome dans un IDE
```

Les vrais plugins gagnent au fil du temps un dossier `Controllers/`, `Data/` (un `DbContext` +
des migrations EF) et `Services/` selon leurs besoins - regarde `src/Schuly.Plugin.Schulware/`
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

Enregistre ici tes services, options, la tâche en arrière-plan et le login. `context` expose :

- `context.ConnectionString` - la chaîne de connexion Postgres dédiée au plugin (l'hôte la
  modifie pour cibler `schuly_plugin_<name>` ; voir [migrations.md](migrations.md)).
- `context.Configuration` - la configuration YAML du plugin (`Schuly.Plugin.<Name>.yml`).

Enregistrements typiques (tirés de Schulware/OdaOrg) :

```csharp
services.AddDbContext<MyDbContext>(o => o.UseNpgsql(context.ConnectionString));

services.AddSingleton<MySyncTask>();
services.AddSingleton<IPluginBackgroundTask>(sp => sp.GetRequiredService<MySyncTask>());

// Coffre-fort de secrets en mémoire, isolé par plugin, indexé par le nom du plugin par l'hôte.
services.AddScoped(sp => new MySecretStore(
    sp.GetRequiredKeyedService<IPluginVault>(MyPlugin.PluginName)));

services.AddScoped<IPluginLogin, MyLogin>();
```

> La clé du coffre-fort doit être une constante (utilisée avec
> `[FromKeyedServices(PluginName)]`), expose donc un `public const string PluginName`. Le
> coffre-fort n'existe qu'en mémoire - les secrets ne survivent **pas** à un redémarrage du
> backend, et le code de synchronisation doit gérer le cas d'un coffre vide ("reconnexion
> nécessaire").

### `ConfigureEndpoints(IEndpointRouteBuilder endpoints)`

Mappe ici les routes en API minimale. Le plugin Example l'utilise directement :

```csharp
endpoints.MapGet("/api/plugins/example/hello",
    (IPluginUserContext userContext) => Results.Ok(...)).RequireAuthorization();
endpoints.MapGet("/api/plugins/example/info", () => Results.Ok(...)).AllowAnonymous();
```

Les plugins Schulware et OdaOrg laissent cette méthode vide et placent plutôt leurs routes dans
`Controllers/` sous forme de contrôleurs ASP.NET MVC - l'hôte enregistre l'assembly du plugin
comme ApplicationPart MVC, donc les contrôleurs `[ApiController]` sont découverts
automatiquement. Les deux approches fonctionnent ; les contrôleurs passent mieux à l'échelle
pour des surfaces plus vastes.

### `MigrateAsync(IServiceProvider serviceProvider, CancellationToken)`

Applique les migrations EF Core. Résous le `DbContext` depuis un scope et appelle
`db.Database.MigrateAsync()`. Le plugin Example (sans base de données) retourne simplement
`Task.CompletedTask`. Voir [migrations.md](migrations.md) - utilise `MigrateAsync()`, jamais
`EnsureCreatedAsync`.

### `IPluginBackgroundTask` (optionnel)

Travail récurrent. Implémente `Name`, `Interval` et `ExecuteAsync`. Le `PluginBackgroundTaskHost`
du backend invoque `ExecuteAsync` à chaque tick d'`Interval` :

```csharp
public class MySyncTask : IPluginBackgroundTask
{
    public string Name => "My Data Sync";
    public TimeSpan Interval => TimeSpan.FromMinutes(30);

    public async Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken ct)
    {
        using var scope = serviceProvider.CreateScope();
        // résoudre les services à portée limitée, effectuer le travail
    }
}
```
