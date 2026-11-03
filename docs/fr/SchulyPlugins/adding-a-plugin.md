# Ajouter un plugin

Ce guide t'amène d'une copie du plugin d'exemple à un plugin que ton serveur local charge, puis à sa
livraison. Avant de commencer, [configure ton environnement](setup/development.md).

## 1. Copier l'exemple

[`src/Schuly.Plugin.Example/`](https://github.com/schulydev/SchulyPlugins/tree/main/src/Schuly.Plugin.Example)
est volontairement minimal :

```
src/Schuly.Plugin.Example/
├── ExamplePlugin.cs                  # ISchulyPlugin implementation
├── Schuly.Plugin.Example.csproj
└── Schuly.Plugin.Example.slnx        # opens this plugin standalone in an IDE
```

1. Copie le dossier vers `src/Schuly.Plugin.<Name>/`.
2. Renomme `ExamplePlugin.cs` en `<Name>Plugin.cs`. Renomme la classe et le namespace en conséquence. La
   classe implémente `ISchulyPlugin`.
3. Renomme le `.csproj` et le `.slnx` en `Schuly.Plugin.<Name>`, et mets à jour le chemin du projet dans le
   `.slnx`.

Tu obtiens ceci :

```
src/Schuly.Plugin.<Name>/
├── <Name>Plugin.cs
├── Schuly.Plugin.<Name>.csproj
└── Schuly.Plugin.<Name>.slnx
```

Les vrais plugins ajoutent `Controllers/`, `Data/` (un `DbContext` et des migrations EF) et `Services/` selon
leurs besoins. Rien de cela n'est requis pour commencer. Pour voir à quoi cela ressemble, lis
[`Schuly.Plugin.Schulware`](https://github.com/schulydev/SchulyPlugins/tree/main/src/Schuly.Plugin.Schulware)
ou [`Schuly.Plugin.OdaOrg`](https://github.com/schulydev/SchulyPlugins/tree/main/src/Schuly.Plugin.OdaOrg).

## 2. Définir les propriétés du projet

Dans le `.csproj` :

1. Garde `<TargetFramework>net10.0</TargetFramework>` et la `PackageReference`
   `Schuly.Plugin.Abstractions`.
2. Définis `<Version>`, `<Description>` et `<Authors>`. Ils vont dans l'index publié.
3. Pour utiliser les helpers partagés de `src/Shared/` (namespace `Schuly.Plugin.Shared`), compile-les dans
   le plugin :

   ```xml
   <ItemGroup>
     <Compile Include="..\Shared\**\*.cs" />
   </ItemGroup>
   ```

## 3. Implémenter la classe du plugin

La classe du plugin est la racine de composition, légère comme un `Program.cs`. L'hôte la crée avec
`Activator.CreateInstance`, donc elle a besoin d'un constructeur public sans paramètre.

Choisis `Name` avec soin et garde-le stable. L'hôte en dérive le nom de la base de données du plugin, le
namespace du coffre-fort et le préfixe d'environnement `SCHULY_PLUGIN_<NAME>_`.

Quand il charge un plugin, l'hôte appelle ces membres dans cet ordre :

1. `ConfigureServices`
2. `MigrateAsync`
3. `ConfigureEndpoints`

Il enregistre ensuite tes contrôleurs, planifie tes tâches en arrière-plan et ajoute ton système scolaire au
catalogue.

### `ConfigureServices(IServiceCollection services, PluginServiceContext context)`

Enregistre tes services, tes options, ta tâche en arrière-plan et ta connexion. Chaque plugin a son propre
conteneur de services. `context` te donne :

- `context.ConnectionString` : la base de données Postgres propre au plugin. Voir [migrations](migrations.md).
- `context.Configuration` : la configuration de l'hôte, avec par-dessus le `Schuly.Plugin.<Name>.yml` du
  plugin et les variables d'environnement `SCHULY_PLUGIN_<NAME>_`.

Enregistrements typiques, tirés de Schulware et d'OdaOrg :

```csharp
services.AddDbContext<MyDbContext>(o => o.UseNpgsql(context.ConnectionString));

services.AddSingleton<MySyncTask>();
services.AddSingleton<IPluginBackgroundTask>(sp => sp.GetRequiredService<MySyncTask>());

// Takes the plugin's own IPluginVault, which the host registers.
services.AddScoped<MySecretStore>();

services.AddScoped<IPluginLogin, MyLogin>();
```

L'hôte enregistre ces services du contrat dans le conteneur de chaque plugin. Injecte-les, jamais les types
propres au backend. L'hôte refuse de charger un plugin qui référence un assembly du backend.

| Service | À utiliser pour |
|---|---|
| `ISchoolData` | Provisionner l'école et l'élève, puis synchroniser l'agenda, les notes, les examens, les absences, les documents et les bulletins semestriels |
| `IPluginVault` | Conserver des jetons et des identifiants, chiffrés, dans le namespace propre au plugin |
| `IPluginFileStore` | Stocker un fichier téléchargé, comme un bulletin, et obtenir sa clé |
| `IPluginUserContext` | Lire l'utilisateur courant pendant une requête de connexion |
| `ILinkedAccounts` | Lire et enregistrer les comptes qu'un utilisateur a liés à un fournisseur externe, partagés par tous les plugins |

L'hôte fournit aussi `ILogger<T>`, `IHttpClientFactory`, `IHttpContextAccessor` et `IConfiguration`.

### `MigrateAsync(IServiceProvider serviceProvider, CancellationToken)`

Applique les migrations EF Core. Résous le `DbContext` depuis un scope et appelle
`db.Database.MigrateAsync()`. Utilise `MigrateAsync()`, jamais `EnsureCreatedAsync`. Voir
[migrations](migrations.md).

Un plugin sans base de données, comme le plugin Example, renvoie `Task.CompletedTask`.

### `ConfigureEndpoints(IEndpointRouteBuilder endpoints)`

Mappe ici les routes minimal-API. Le plugin Example fait ceci :

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

Tu peux aussi laisser cette méthode vide et mettre tes routes dans `Controllers/`, comme les plugins
Schulware, OdaOrg et Microsoft. L'hôte enregistre l'assembly du plugin comme ApplicationPart MVC, donc il
trouve automatiquement les contrôleurs `[ApiController]`. Les deux approches fonctionnent. Les contrôleurs
conviennent mieux aux surfaces plus grandes.

## 4. Ajouter des fonctions

Ajoute les parties dont ton plugin a besoin. La
[référence du contrat](/fr/SchulyPluginAbstractions/contract) liste chaque interface et chaque record.

### Permettre aux utilisateurs de connecter un compte

Implémente `IPluginLogin` et enregistre-le. Son descripteur `SchoolSystem` fait apparaître ton système
scolaire dans l'application.

### Synchroniser les données scolaires

Construis des records simples et donne-les à `ISchoolData` :

- Donne à chaque record un `ExternalId` stable (`src/Shared/ExternalIds.cs`).
- Convertis d'abord les heures locales du fournisseur en UTC (`src/Shared/SwissTime.cs` pour les systèmes
  suisses). Le backend stocke uniquement de l'UTC.

```csharp
var records = lessons.Select(l => new AgendaRecord(ExternalIds.Of("lesson", l.Start.ToString("O"), l.Course), AgendaKind.Lesson, l.Title, l.Start, l.End, l.Room)).ToList();
await schoolData.SyncAgendaAsync(account.SchoolUserId!.Value, records, ct);
```

### Exécuter un travail récurrent

Implémente `IPluginBackgroundTask` : `Name`, `Schedule` et `ExecuteAsync`. L'hôte exécute `ExecuteAsync` selon
le `Schedule`. Les opérateurs surchargent une planification par le `Name` de la tâche, donc garde ce nom
stable.

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

## 5. Le charger sur ton serveur local

1. Suis [Exécuter un plugin sur un serveur local](setup/development.md#executer-un-plugin-sur-un-serveur-local).
2. Cherche `Loaded plugin <your plugin name> v<version>` dans le journal du serveur. Si le chargement échoue,
   le journal contient `Failed to load plugin` et la raison.
3. Appelle une de tes routes pour confirmer qu'elle répond.

## 6. Le livrer

1. Ouvre une issue avec le label `new-plugin`, puis suis le [processus partagé](/fr/contribute/).
2. Fusionne dans `main`. `build_push.yml` trouve automatiquement tout `src/Schuly.Plugin.*/*.csproj`, donc tu
   ne modifies aucun workflow. Voir [distribution](setup/distribution.md).
3. Pour installer le plugin publié, ajoute-le au `plugins.yml` du serveur. Voir
   [Gestion des plugins](/fr/SchulyServer/plugin-management).
