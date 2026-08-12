# Référence du contrat

Tout ce que contient le package vit dans le namespace `Schuly.Plugin.Abstractions` et cible
`net10.0`. Le contrat comprend **5 interfaces** plus deux petits records. Toutes les signatures
ci-dessous sont recopiées telles quelles depuis le code source sous
`src/Schuly.Plugin.Abstractions/`.

> Le package embarque également les DLL du backend `Schuly.Domain.dll` et
> `Schuly.Infrastructure.dll` aux côtés de l'assembly abstractions (voir le csproj), afin que
> les plugins puissent utiliser les entités typées et le DbContext du backend pour un accès
> direct à la base de données. Voir [développement](setup/development.md) pour la façon dont
> elles sont référencées.

## `ISchulyPlugin`

Le point d'entrée du plugin. Le backend en instancie un par plugin et le pilote tout au long de
son cycle de vie.

```csharp
public interface ISchulyPlugin
{
    string Name { get; }
    string Version { get; }
    void ConfigureServices(IServiceCollection services, PluginServiceContext context);
    void ConfigureEndpoints(IEndpointRouteBuilder endpoints);
    Task MigrateAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken = default);
}
```

| Membre | Rôle | Quand |
|---|---|---|
| `Name` | Identifiant stable du plugin. | Lu lors de la découverte. |
| `Version` | Chaîne de version propre au plugin. | Lue lors de la découverte. |
| `ConfigureServices(IServiceCollection, PluginServiceContext)` | Enregistre les services, handlers et options dans le conteneur DI de l'hôte. | Au démarrage, avant que l'app soit construite. |
| `ConfigureEndpoints(IEndpointRouteBuilder)` | Mappe les endpoints HTTP du plugin. | Au démarrage, une fois les services construits. |
| `MigrateAsync(IServiceProvider, CancellationToken)` | Exécute les migrations EF Core propres au plugin (`db.Database.MigrateAsync()`). | Au démarrage, dès que le service provider est disponible. |

### `PluginServiceContext`

Le contexte transmis à `ConfigureServices`.

```csharp
public record PluginServiceContext(string ConnectionString, IConfiguration Configuration);
```

| Membre | Rôle |
|---|---|
| `ConnectionString` | La chaîne de connexion à la base de données du plugin (l'hôte isole chaque plugin dans sa propre base). |
| `Configuration` | L'`IConfiguration` de l'hôte, pour lire les options du plugin. |

## `IPluginBackgroundTask`

Travail récurrent en arrière-plan. Le `PluginBackgroundTaskHost` du backend invoque
`ExecuteAsync` selon l'`Interval` configuré.

```csharp
public interface IPluginBackgroundTask
{
    string Name { get; }
    TimeSpan Interval { get; }
    Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken);
}
```

| Membre | Rôle |
|---|---|
| `Name` | Identifiant de la tâche (pour le logging/diagnostic). |
| `Interval` | Fréquence à laquelle l'hôte exécute la tâche. |
| `ExecuteAsync(IServiceProvider, CancellationToken)` | Une exécution du travail. Résous les services scoped depuis `serviceProvider`. |

## `IPluginEventHandler<TCommand>`

Réagit à une commande du backend. `TCommand` est contravariant (`in TCommand`).

```csharp
public interface IPluginEventHandler<in TCommand>
{
    Task HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}
```

| Membre | Rôle |
|---|---|
| `HandleAsync(TCommand, CancellationToken)` | Traite une commande distribuée. |

## `IPluginUserContext`

Lit l'utilisateur courant / le school-user depuis l'intérieur d'un plugin.

```csharp
public interface IPluginUserContext
{
    Task<Guid> GetCurrentUserIdAsync(CancellationToken cancellationToken = default);
    Task<Guid?> GetCurrentSchoolUserIdAsync(CancellationToken cancellationToken = default);
}
```

| Membre | Rôle |
|---|---|
| `GetCurrentUserIdAsync(CancellationToken)` | L'id de l'utilisateur applicatif courant. |
| `GetCurrentSchoolUserIdAsync(CancellationToken)` | L'id du school-user courant, ou `null` si aucun n'est présent dans le contexte. |

## `IPluginLogin`

Le contrat de connexion de compte d'un plugin - **et la source de son entrée dans le catalogue
des systèmes scolaires**. Le plugin expose un descripteur `SchoolSystem` ; le backend le
collecte auprès de chaque plugin chargé et alimente le catalogue (seed-if-missing par `Key`),
si bien que l'opérateur n'a plus à fournir de configuration de catalogue. Le backend expose
ensuite un unique endpoint de login unifié, résout l'`IPluginLogin` dont le `SystemKey`
correspond au système demandé, et appelle `ConnectAsync` avec les valeurs de champs de
connexion collectées par l'app à partir de ce descripteur. Le plugin lit l'utilisateur courant
via `IPluginUserContext`, s'authentifie auprès de son fournisseur, persiste le compte et
retourne son id. Aucune authentification de fournisseur ne vit dans le backend.

```csharp
public interface IPluginLogin
{
    SchoolSystemDescriptor SchoolSystem { get; }   // the catalog entry this login serves
    string SystemKey => SchoolSystem.Key;          // default member - defaults to SchoolSystem.Key

    Task<PluginLoginResult> ConnectAsync(
        IReadOnlyDictionary<string, string> fields,
        string? displayName,
        CancellationToken cancellationToken = default);
}
```

| Membre | Rôle |
|---|---|
| `SchoolSystem` | Le descripteur de catalogue rendu par l'app : `Key`, `DisplayName`, `LoginMethod`, `PrivateAuthStrategy` (`"token"`/`"scrape"`), `StatelessBasePath`, `PluginBasePath`, `SortOrder`, et les `LoginFields` collectés par l'app. |
| `SystemKey` | La clé système du catalogue que ce login gère, p. ex. `"schulnetz"`. Membre par défaut retournant `SchoolSystem.Key` ; tu n'implémentes que `SchoolSystem`. |
| `ConnectAsync(IReadOnlyDictionary<string,string>, string?, CancellationToken)` | Connecte un compte à partir des champs de connexion collectés, indexés par les clés `LoginFields` du descripteur (p. ex. `"email"`, `"password"`, `"baseUrl"`). `displayName` est un nom convivial optionnel. |

`SchoolSystemDescriptor` (et ses `LoginFields` de type `SchoolSystemLoginFieldDescriptor`)
vivent dans `Schuly.Plugin.Abstractions` ; construis-les dans ton `IPluginLogin` :

```csharp
public SchoolSystemDescriptor SchoolSystem => new()
{
    Key = "schulnetz",
    DisplayName = "Schulnetz",
    LoginMethod = "credentials",
    PrivateAuthStrategy = "token",
    StatelessBasePath = "/api/plugins/schulware/stateless",
    PluginBasePath = "/api/plugins/schulware",
    LoginFields =
    [
        new() { Key = "baseUrl",  Label = "Schulnetz URL", Type = "url",      Required = true },
        new() { Key = "email",    Label = "Email",         Type = "text",     Required = true },
        new() { Key = "password", Label = "Password",      Type = "password", Required = true },
    ],
};
```

### `PluginLoginResult`

Résultat de `ConnectAsync`.

```csharp
public record PluginLoginResult(bool Success, Guid? AccountId = null, string? Message = null);
```

| Membre | Rôle |
|---|---|
| `Success` | Indique si la connexion a réussi. |
| `AccountId` | L'id du compte persisté en cas de succès. |
| `Message` | Détail optionnel lisible par un humain (p. ex. la raison d'une erreur). |

---

Voir [versionnement](versioning.md) pour les règles qui régissent les changements apportés à
l'un de ces membres.
