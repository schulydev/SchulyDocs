# Référence du contrat

Utilise cette page pour consulter chaque interface et chaque record du contrat de plugin.

Le package cible `net10.0`. Les types se trouvent dans le namespace `Schuly.Plugin.Abstractions`, sauf les
types de liaison (`ILinkProvider` et types associés), qui se trouvent dans
`Schuly.Plugin.Abstractions.Linking`. Les signatures ci-dessous correspondent au code source dans
[`src/Schuly.Plugin.Abstractions/`](https://github.com/schulydev/SchulyPluginAbstractions/tree/main/src/Schuly.Plugin.Abstractions).

Les plugins ne touchent jamais aux entités ni à la base de données du backend. L'hôte enregistre ces
services dans le conteneur de chaque plugin :

| Service | Rôle |
|---|---|
| `IPluginUserContext` | L'utilisateur courant et l'utilisateur scolaire |
| `ISchoolData` | Écrire des données scolaires |
| `IPluginVault` | Le coffre-fort de secrets chiffré propre au plugin |
| `IPluginFileStore` | Stocker les fichiers téléchargés dans le stockage de documents de Schuly |
| `ILinkedAccounts` | Les comptes qu'un utilisateur a liés à un fournisseur externe, partagés par tous les plugins |

L'hôte fournit aussi `ILogger<T>`, `IHttpClientFactory`, `IHttpContextAccessor` et `IConfiguration`.

Un plugin garde son propre état, comme les comptes et les curseurs de synchronisation, dans sa propre base
de données par `PluginServiceContext.ConnectionString`.

## `ISchulyPlugin`

Le point d'entrée du plugin. L'hôte crée une instance par plugin et lui fait suivre le cycle de vie. Il
appelle les méthodes dans l'ordre indiqué dans le tableau.

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
| `Name` | Identifiant stable du plugin. L'hôte en dérive le nom de la base de données du plugin, le namespace du coffre-fort et le préfixe des variables d'environnement. | Lu au chargement. |
| `Version` | La chaîne de version propre au plugin. | Lu au chargement. |
| `ConfigureServices(IServiceCollection, PluginServiceContext)` | Enregistrer les services, les handlers et les options dans le conteneur de services propre au plugin. | En premier, pendant que l'hôte construit le conteneur du plugin. |
| `MigrateAsync(IServiceProvider, CancellationToken)` | Exécuter les migrations EF Core propres au plugin (`db.Database.MigrateAsync()`). | En deuxième, après la construction du conteneur du plugin. |
| `ConfigureEndpoints(IEndpointRouteBuilder)` | Mapper les points d'entrée HTTP du plugin. | En troisième, après les migrations. |

### `PluginServiceContext`

Le contexte transmis à `ConfigureServices`.

```csharp
public record PluginServiceContext(string ConnectionString, IConfiguration Configuration);
```

| Membre | Rôle |
|---|---|
| `ConnectionString` | La chaîne de connexion à la base de données du plugin. L'hôte donne à chaque plugin sa propre base de données. |
| `Configuration` | La `IConfiguration` de l'hôte, avec par-dessus le `<AssemblyName>.yml` du plugin et les variables d'environnement `SCHULY_PLUGIN_<NAME>_`. |

## `IPluginBackgroundTask`

Travail récurrent en arrière-plan. Le planificateur de l'hôte exécute `ExecuteAsync` selon le `Schedule` de
la tâche. Une tâche ne se chevauche jamais avec elle-même.

```csharp
public interface IPluginBackgroundTask
{
    string Name { get; }
    PluginSchedule Schedule { get; }
    Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken);
}
```

| Membre | Rôle |
|---|---|
| `Name` | Identifiant de la tâche, pour la journalisation et le diagnostic. L'hôte l'utilise aussi pour trouver la tâche et comme clé des surcharges de planification, donc garde-le stable et unique dans le plugin. |
| `Schedule` | La planification par défaut de la tâche. L'opérateur de l'hôte peut surcharger la cadence. |
| `ExecuteAsync(IServiceProvider, CancellationToken)` | Une exécution du travail. Résous les services scoped depuis `serviceProvider`. |

### `PluginSchedule`

La planification par défaut du plugin pour une tâche en arrière-plan, sous forme de valeur indépendante du
planificateur et sans dépendance au-delà de la BCL. L'hôte la traduit vers son propre planificateur, et
l'opérateur de l'hôte peut surcharger la cadence par déploiement. Traite ces valeurs comme une valeur par
défaut, pas comme une garantie.

```csharp
public sealed record PluginSchedule(string Cron, int Retries = 0, IReadOnlyList<TimeSpan>? RetryIntervals = null, bool RunOnStartup = false)
```

| Membre | Rôle |
|---|---|
| `Cron` | Expression cron standard à 5 champs (`minute hour day-of-month month day-of-week`). Validée dans le constructeur et à chaque expression `with`. Une expression invalide lève `ArgumentException`. |
| `Retries` | Nombre de fois où l'hôte réessaie une exécution échouée. Doit être `>= 0`, sinon lève `ArgumentOutOfRangeException`. |
| `RetryIntervals` | Délai avant chaque nouvel essai. Quand il y a plus d'essais que d'intervalles, l'hôte réutilise le dernier intervalle pour les essais restants. `null` signifie que la valeur par défaut de l'hôte s'applique. Un intervalle négatif lève `ArgumentOutOfRangeException`. |
| `RunOnStartup` | Si l'hôte exécute aussi la tâche une fois immédiatement au démarrage. |

| Fabrique | Produit |
|---|---|
| `Every(TimeSpan interval)` | Une planification à intervalle fixe. Elle n'accepte que des minutes entières qui divisent 60 (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60) ou des heures entières qui divisent 24 (1, 2, 3, 4, 6, 8, 12, 24). Toute autre valeur ne peut pas s'exprimer comme un vrai cron à cadence fixe et lève `ArgumentOutOfRangeException`. |
| `Daily(int hour, int minute = 0)` | Une planification qui se déclenche une fois par jour à `hour:minute`. Une valeur hors limites lève `ArgumentOutOfRangeException`. |
| `Hourly(int minute = 0)` | Une planification qui se déclenche une fois par heure à `minute`. Une valeur hors limites lève `ArgumentOutOfRangeException`. |

```csharp
public sealed class SyncTimetableTask : IPluginBackgroundTask
{
    public string Name => "schulware.sync-timetable";
    public PluginSchedule Schedule => PluginSchedule.Every(TimeSpan.FromMinutes(30));

    public Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken) => Task.CompletedTask;
}
```

Pour une planification que les fabriques ne peuvent pas exprimer, construis directement `PluginSchedule`
avec une chaîne cron et, si besoin, un comportement de nouvel essai :

```csharp
public PluginSchedule Schedule => new("0 6 * * MON-FRI", Retries: 3, RetryIntervals: [TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5)]);
```

## `IPluginEventHandler<TCommand>`

Réagir à une commande ou à un événement du backend. `TCommand` est contravariant (`in TCommand`).
Enregistre le handler dans `ConfigureServices`. Si un handler lève une exception, l'hôte journalise
l'erreur et continue avec les autres handlers.

```csharp
public interface IPluginEventHandler<in TCommand>
{
    Task HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}
```

| Membre | Rôle |
|---|---|
| `HandleAsync(TCommand, CancellationToken)` | Traiter une commande distribuée. |

### `PluginUserPurgeEvent`

L'hôte distribue cet événement quand un utilisateur Schuly est en cours de suppression. Traite-le avec
`IPluginEventHandler<PluginUserPurgeEvent>` pour effacer les données propres au plugin pour cet
utilisateur : ses lignes en base de données et les secrets du coffre-fort liés à l'utilisateur. L'hôte
supprime lui-même les données du cœur, mais il ne peut atteindre le stockage d'un plugin que par le plugin.

```csharp
public sealed record PluginUserPurgeEvent(Guid ApplicationUserId);
```

## `IPluginUserContext`

Lire l'utilisateur courant et l'utilisateur scolaire depuis un plugin.

```csharp
public interface IPluginUserContext
{
    Task<Guid> GetCurrentUserIdAsync(CancellationToken cancellationToken = default);
    Task<Guid?> GetCurrentSchoolUserIdAsync(CancellationToken cancellationToken = default);
}
```

| Membre | Rôle |
|---|---|
| `GetCurrentUserIdAsync(CancellationToken)` | L'id de l'utilisateur courant de l'application. |
| `GetCurrentSchoolUserIdAsync(CancellationToken)` | L'id de l'utilisateur scolaire courant, ou `null` s'il n'y en a aucun dans le contexte. |

## `IPluginLogin`

Le contrat de connexion de compte d'un plugin, et la source de son entrée dans le catalogue des systèmes
scolaires.

1. Le plugin expose un descripteur `SchoolSystem`. L'hôte le récupère de chaque plugin chargé et l'ajoute
   au catalogue par `Key`, donc l'opérateur ne fournit aucune configuration de catalogue. Le nom affiché, le
   logo, l'état activé et l'ordre de tri sont initialisés une seule fois. Les paramètres de connexion
   suivent le plugin à chaque chargement.
2. L'hôte expose un point d'entrée de connexion unifié. Il résout le `IPluginLogin` dont le `SystemKey`
   correspond au système demandé et appelle `ConnectAsync` avec les valeurs des champs de connexion que
   l'application a collectées.
3. Le plugin lit l'utilisateur courant par `IPluginUserContext`, s'authentifie auprès de son fournisseur,
   enregistre le compte et renvoie son id. Aucune authentification de fournisseur ne se trouve dans le
   backend.

```csharp
public interface IPluginLogin
{
    SchoolSystemDescriptor SchoolSystem { get; }

    string SystemKey => SchoolSystem.Key;

    Task<PluginLoginResult> ConnectAsync(IReadOnlyDictionary<string, string> fields, string? displayName, CancellationToken cancellationToken = default);
}
```

| Membre | Rôle |
|---|---|
| `SchoolSystem` | L'entrée de catalogue que cette connexion sert, et que l'application affiche. Voir `SchoolSystemDescriptor`. |
| `SystemKey` | La clé de système du catalogue que cette connexion gère, comme `"schulnetz"`. Un membre par défaut qui renvoie `SchoolSystem.Key`, donc tu n'implémentes que `SchoolSystem`. |
| `ConnectAsync(IReadOnlyDictionary<string,string>, string?, CancellationToken)` | Connecter un compte à partir des champs de connexion collectés, indexés par les clés `LoginFields` du descripteur (comme `"email"`, `"password"`, `"baseUrl"`). `displayName` est un nom convivial optionnel. |

### `SchoolSystemDescriptor`

Construis ce record dans ton `IPluginLogin`.

| Membre | Rôle |
|---|---|
| `Key` | Obligatoire. La clé du système, comme `"schulnetz"`. |
| `DisplayName` | Obligatoire. Le nom que l'application affiche. |
| `LoginMethod` | `"credentials"` (par défaut) ou `"oauth-webview"`. |
| `LogoUrl` | Logo optionnel. |
| `PrivateAuthStrategy` | `"token"` (une connexion sans interface crée un jeton bearer) ou `"scrape"` (identifiants renvoyés à chaque récupération). |
| `StatelessBasePath` | Points d'entrée du mode privé, comme `"/api/plugins/schulware/stateless"`. |
| `PluginBasePath` | Points d'entrée du mode compte, comme `"/api/plugins/schulware"`. |
| `LoginMethodPath` | Point d'entrée anonyme que l'application appelle (GET, `?baseUrl=`) une fois l'URL de l'école saisie. Il répond par un `LoginMethodResult`. |
| `Enabled` | Si le système est activé. Vaut `true` par défaut. |
| `SortOrder` | Position dans le catalogue. |
| `LoginFields` | Les champs `SchoolSystemLoginFieldDescriptor` que l'application affiche pour collecter ce dont `ConnectAsync` a besoin. |

La constante `SchoolSystemDescriptor.LinkedAccountFieldKey` (`"linkedAccountId"`) est le champ de connexion
qui porte l'id du compte lié choisi.

### `SchoolSystemLoginFieldDescriptor`

| Membre | Rôle |
|---|---|
| `Key` | Obligatoire. Envoyé avec la valeur collectée, comme `"baseUrl"`. |
| `Label` | Obligatoire. Le libellé du champ. |
| `Type` | `"url"`, `"text"` (par défaut) ou `"password"`. |
| `Placeholder` | Texte indicatif optionnel. |
| `DefaultValue` | Valeur par défaut optionnelle. |
| `Required` | Vaut `true` par défaut. |
| `ReplacedByLinkedAccount` | Masqué quand l'école se connecte avec un compte lié, comme les champs d'e-mail, de mot de passe et de 2FA. |
| `Suggestions` | Valeurs connues que l'application propose de choisir, comme des écoles et leurs URL, sous forme de `LoginFieldSuggestion`. L'utilisateur peut toujours saisir une autre valeur. |

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
        new()
        {
            Key = "baseUrl", Label = "Schulnetz URL", Type = "url", Required = true,
            Suggestions = [new("BBB Berufsfachschule Baden", "https://schulnetz.bbbaden.ch")],
        },
        new() { Key = "email",    Label = "Email",         Type = "text",     Required = true },
        new() { Key = "password", Label = "Password",      Type = "password", Required = true },
    ],
};
```

### Méthode de connexion et connexion par navigateur

```csharp
public sealed record LoginFieldSuggestion(string Label, string Value);
public sealed record LoginMethodResult(string? LinkedProvider) { public string? BrowserLoginPath { get; init; } }
public sealed record BrowserLoginStart(string AuthUrl, string CallbackUrl, string State, string Context, string? CompletePath) { public const string CallbackFieldKey = "browserCallbackUrl"; public const string ContextFieldKey = "browserContext"; }
```

`LoginMethodPath` répond par un `LoginMethodResult`. Un `LinkedProvider` null sans `BrowserLoginPath`
signifie de simples identifiants.

- **Compte lié.** Définis `LinkedProvider` quand l'école se connecte avec un compte lié. L'application
  affiche les comptes liés de ce fournisseur et envoie `linkedAccountId` à la place des champs marqués
  `ReplacedByLinkedAccount`.
- **Connexion par navigateur.** Définis `BrowserLoginPath` quand l'école se connecte par un navigateur,
  comme une connexion cantonale qu'aucun serveur ne peut remplir. L'application masque les champs marqués
  `ReplacedByLinkedAccount` et envoie en POST `{ "baseUrl": ... }` à `BrowserLoginPath`, qui renvoie un
  `BrowserLoginStart`. L'application ouvre `AuthUrl`, attend une URL commençant par `CallbackUrl` dont le
  `state` correspond à `State`, et envoie cette URL et `Context` dans les champs `browserCallbackUrl` et
  `browserContext` : à `ConnectAsync` en mode compte, ou à `CompletePath` en mode privé.

### `PluginLoginResult`

Le résultat de `ConnectAsync`.

```csharp
public record PluginLoginResult(bool Success, Guid? AccountId = null, string? Message = null);
```

| Membre | Rôle |
|---|---|
| `Success` | Si la connexion a réussi. |
| `AccountId` | L'id du compte enregistré en cas de réussite. |
| `Message` | Détail lisible optionnel, comme la raison d'une erreur. |

## `ISchoolData`

L'accès en écriture du plugin aux données scolaires de Schuly. L'hôte marque chaque ligne avec le plugin
appelant comme source et ne laisse un plugin écrire que pour les élèves qu'il a provisionnés. Écrire pour
l'élève d'un autre plugin lève `UnauthorizedAccessException`.

```csharp
public interface ISchoolData
{
    Task<Guid> EnsureSchoolAsync(SchoolRecord school, CancellationToken cancellationToken = default);
    Task<Guid> EnsureStudentAsync(Guid schoolId, Guid applicationUserId, StudentRecord student, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncAgendaAsync(Guid schoolUserId, IReadOnlyCollection<AgendaRecord> entries, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncGradesAsync(Guid schoolUserId, IReadOnlyCollection<GradeRecord> grades, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncExamsAsync(Guid schoolUserId, IReadOnlyCollection<ExamRecord> exams, CancellationToken cancellationToken = default) => Task.FromResult(new SyncResult(0, 0));
    Task<SyncResult> SyncAbsencesAsync(Guid schoolUserId, IReadOnlyCollection<AbsenceRecord> absences, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncDocumentsAsync(Guid schoolUserId, IReadOnlyCollection<DocumentRecord> documents, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncSemesterReportsAsync(Guid schoolUserId, IReadOnlyCollection<SemesterReportRecord> reports, CancellationToken cancellationToken = default);
    Task<IReadOnlySet<string>> GetDocumentIdsAsync(Guid schoolUserId, CancellationToken cancellationToken = default);
}

public sealed record SyncResult(int Added, int Updated);
```

| Membre | Rôle |
|---|---|
| `EnsureSchoolAsync` | Trouve une école par site web (ou par nom si elle n'en a pas) et la crée si elle manque. Renvoie son id. |
| `EnsureStudentAsync` | Trouve le profil d'élève de l'utilisateur dans l'école, le crée s'il manque et remplit les champs vides. Renvoie l'id de l'utilisateur scolaire. |
| `SyncAgendaAsync`, `SyncGradesAsync`, `SyncAbsencesAsync`, `SyncDocumentsAsync` | Insèrent ou mettent à jour les records par `ExternalId` : les id inconnus sont ajoutés, les id connus sont mis à jour. Renvoient `SyncResult(Added, Updated)`. |
| `SyncExamsAsync` | Insère ou met à jour les examens par branche et par nom. `ExamRecord` n'a pas d'`ExternalId`. Renvoie `SyncResult(Added, Updated)`. |
| `SyncSemesterReportsAsync` | Insère ou met à jour les bulletins semestriels par code de programme, année scolaire et semestre. Les branches de chaque bulletin sont remplacées en entier. Renvoie `SyncResult(Added, Updated)`. |
| `GetDocumentIdsAsync` | Les id externes des documents que ce plugin a déjà synchronisés pour l'élève, pour qu'il puisse éviter de les télécharger à nouveau. |

`SyncGradesAsync` crée la branche (classe) et l'examen de chaque note si nécessaire et inscrit l'élève.
`SyncExamsAsync` fait de même pour les examens sans note pour l'instant, comme les tests à venir. Comme un
examen est retrouvé par branche et par nom, une note ultérieure arrive sur le même examen. Les hôtes
antérieurs à 0.8 ignorent `SyncExamsAsync` : l'implémentation par défaut ne fait rien.

### Records

```csharp
public sealed record SchoolRecord(string Name, string? Website = null, string? LogoUrl = null);
public sealed record StudentRecord { public string? FirstName { get; init; } public string? LastName { get; init; } public string? Email { get; init; } public string? PrivateEmail { get; init; } public string? PhoneNumber { get; init; } public string? Street { get; init; } public string? City { get; init; } public string? Zip { get; init; } public DateOnly? Birthday { get; init; } public DateOnly? EntryDate { get; init; } public DateOnly? LeaveDate { get; init; } public string? ProfilePictureUrl { get; init; } }
public enum AgendaKind { Event = 0, Lesson = 1, Test = 2, Holiday = 3 }
public sealed record AgendaRecord(string ExternalId, AgendaKind Kind, string Title, DateTimeOffset Start, DateTimeOffset? End = null, string? Place = null, string? Description = null);
public sealed record GradeRecord(string ExternalId, string Subject, string ExamName, decimal Score, decimal Weight = 1, DateOnly? ExamDate = null) { public decimal? ClassAverage { get; init; } }
public sealed record ExamRecord(string Subject, string Name, DateOnly Date) { public string? Description { get; init; } public decimal? ClassAverage { get; init; } }
public sealed record AbsenceRecord(string ExternalId, DateTimeOffset From, DateTimeOffset Until, string? Reason = null, bool IsLate = false) { public bool? IsExcused { get; init; } }
public sealed record SemesterReportRecord(string ProgramCode, int SchoolYearStart, int SemesterHalf, string ClassName, IReadOnlyList<SemesterSubjectRecord> Subjects, string? PromotionDecision = null, decimal? GradeAverage = null, int? ExcusedAbsences = null, int? UnexcusedAbsences = null);
public sealed record SemesterSubjectRecord(string SubjectCode, string SubjectName, decimal? Grade = null, string? Marker = null, string? SubjectTypeMarker = null);
public sealed record DocumentRecord(string ExternalId, string Title, string? FileName = null, string? Category = null, string? Comment = null, string? EnteredBy = null, StoredFile? File = null);
```

- **Les heures sont des `DateTimeOffset`.** Convertis les heures locales du fournisseur avec le fuseau
  horaire du fournisseur avant de construire un record. Schuly stocke uniquement de l'UTC. Une entrée avec
  une date seule, comme un jour férié ou une absence d'un jour entier, commence à minuit UTC de ce jour.
- **`ExternalId` doit être stable** d'une synchronisation à l'autre pour le même élément. Utilise l'id
  propre du fournisseur s'il y en a un, sinon une clé construite à partir de champs qui ne changent pas.
  L'hôte refuse un id de plus de 300 caractères avec `ArgumentException`.
- **`GradeRecord` :** `Subject` devient la classe, et `ExamName` l'examen dans cette classe. `ClassAverage`
  est la moyenne de classe que l'école indique, quand elle en publie une.
- **`ExamRecord`** correspond à l'examen que crée un `GradeRecord` avec les mêmes `Subject` et `Name`.
- **`AbsenceRecord.IsExcused`** indique si l'école a accepté une excuse. Il vaut `null` quand l'école ne le
  précise pas.
- **`SemesterReportRecord` :** `SchoolYearStart` est l'année où commence l'année scolaire (2025 pour 25/26),
  et `SemesterHalf` vaut 1 ou 2.
- **`SemesterSubjectRecord`** a une `Grade` numérique, ou un `Marker` comme `"disp"` quand il n'y en a pas.
- **`DocumentRecord.File`** est ce que `IPluginFileStore.SaveAsync` a renvoyé, si tu as téléchargé le
  fichier.

## `IPluginVault`

Le coffre-fort de secrets chiffré propre au plugin, pour les jetons et les identifiants. Chaque plugin a son
propre namespace. Les valeurs sont chiffrées au repos (AES-256-GCM) et lisibles uniquement par ce
coffre-fort.

```csharp
public interface IPluginVault
{
    void Set(string key, string value);
    string? Get(string key);
    bool TryGet(string key, [NotNullWhen(true)] out string? value);
    bool Contains(string key);
    bool Remove(string key);
    void Clear();
    int Count { get; }
}
```

## `IPluginFileStore`

Stocke un fichier téléchargé, comme un bulletin, dans le stockage de documents chiffré de Schuly. Transmets
le `StoredFile` renvoyé dans un `DocumentRecord` pour que l'application puisse le télécharger.

```csharp
public interface IPluginFileStore
{
    Task<StoredFile> SaveAsync(Stream content, string fileName, string? contentType, CancellationToken cancellationToken = default);
}

public sealed record StoredFile(string Key, long SizeBytes);
```

## `ILinkedAccounts`

Les comptes qu'un utilisateur a liés à un fournisseur d'identité externe, comme Microsoft, partagés par tous
les plugins : un plugin lie le compte, un autre se connecte avec lui. Chaque appel est limité à l'utilisateur
indiqué. Les secrets sont chiffrés au repos.

```csharp
public interface ILinkedAccounts
{
    Task<IReadOnlyList<LinkedAccount>> ListAsync(Guid applicationUserId, string provider, CancellationToken cancellationToken = default);
    Task<LinkedAccount?> GetAsync(Guid applicationUserId, Guid linkedAccountId, CancellationToken cancellationToken = default);
    Task<LinkedAccount> SaveAsync(Guid applicationUserId, LinkedAccountRecord account, CancellationToken cancellationToken = default);
    Task<bool> RemoveAsync(Guid applicationUserId, Guid linkedAccountId, CancellationToken cancellationToken = default);
    Task<string?> GetSecretAsync(Guid applicationUserId, Guid linkedAccountId, string name, CancellationToken cancellationToken = default);
    Task SetSecretAsync(Guid applicationUserId, Guid linkedAccountId, string name, string value, CancellationToken cancellationToken = default);
}

public sealed record LinkedAccountRecord(string Provider, string ExternalId, string Email, string? DisplayName);
public sealed record LinkedAccount(Guid Id, string Provider, string ExternalId, string Email, string? DisplayName, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
```

| Membre | Rôle |
|---|---|
| `SaveAsync` | Ajoute le compte, ou le met à jour quand l'utilisateur a déjà lié cet `ExternalId` chez le fournisseur. |
| `RemoveAsync` | Supprime le compte et ses secrets. |
| `LinkedProviders.Microsoft` | La clé de fournisseur `"microsoft"`. |
| `LinkedSecrets.RefreshToken` | Le nom de secret `"refresh_token"` : le jeton de rafraîchissement OAuth du fournisseur. |
| `LinkedSecrets.SessionCookies` | Le nom de secret `"session_cookies"` : la session de connexion du fournisseur, sous forme de tableau JSON de cookies `{domain, name, path, value}`. |

## `ILinkProvider`

Liaison de compte affichée par l'hôte (namespace `Schuly.Plugin.Abstractions.Linking`, depuis 0.11). Un
plugin déclare un descripteur et pilote un processus en plusieurs étapes. L'hôte et les clients affichent
les étapes qu'il renvoie, donc aucun client ne code en dur des écrans propres à un plugin. Enregistre-le avec
`services.AddScoped<ILinkProvider, XLinkProvider>()`.

L'hôte lit chaque descripteur une seule fois au chargement. Il journalise et ignore un descripteur invalide
ou en double.

```csharp
public interface ILinkProvider
{
    LinkProviderDescriptor Descriptor { get; }
    Task<LinkStepResult> StartAsync(LinkStartContext context, CancellationToken cancellationToken = default);
    Task<LinkStepResult> SubmitAsync(LinkSubmitContext context, CancellationToken cancellationToken = default);
    Task<LinkStepResult> PollAsync(LinkPollContext context, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<LinkedAccountSummary>> ListAccountsAsync(Guid applicationUserId, CancellationToken cancellationToken = default);
    Task<bool> UnlinkAsync(Guid applicationUserId, string accountId, CancellationToken cancellationToken = default);
}
```

| Type | Rôle |
|---|---|
| `LinkProviderDescriptor` | `Id` (`^[a-z0-9][a-z0-9-]{1,40}$`), `DisplayName`, `Description`, `Icon`, `Capabilities`, `Flows`, `SortOrder`. |
| `LinkIcon` | `Lucide` (nom d'icône en kebab-case, comme `"graduation-cap"`) ou `Svg` (balisage inline). L'hôte assainit le SVG et le sert depuis sa propre URL avec une CSP stricte. |
| `ProviderCapability` | Une fonction que les comptes liés du fournisseur débloquent. Les clients fournissent des interfaces génériques par type et appellent le plugin à `BasePath`. Types connus : `mail`, `chat`, `drive`, `notes`, `calendar`, `absence_reporting`, `school_data`. |
| `LinkFlowDescriptor` | `Id` (même modèle que l'id du fournisseur), `Label`, `Description`, `Platforms` (`LinkPlatforms`, vaut `All` par défaut). |
| `LinkStepResult(Step, State)` | L'étape suivante et un état opaque du plugin. `Done(accountId, title, state)` et `Fail(message)` construisent les étapes finales. Leurs id d'étape sont `DoneStepId` (`"done"`) et `ErrorStepId` (`"error"`). |
| `LinkStep` | `Id`, que le client renvoie à l'envoi. `Kind` (`Form`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Select`, `Done`, `Error`). `Title`, `Description`, `Error` inline et `SubmitLabel`. Le contenu selon le type : `Fields`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Options`, `Done`. `Actions` sont des boutons alternatifs, envoyés sous forme d'id d'action. |
| `LinkField` | Champ de formulaire : `Key` (`^[A-Za-z][A-Za-z0-9_]{0,40}$`), `Label`, `Type`, `Placeholder`, `Help`, `DefaultValue`, `Required`, `Secret`, `MaxLength`, `Pattern` (regex .NET), `Options`, `AllowCustom`. |
| `LinkOption` | `LinkProviderId`, quand il est défini, signifie « lier d'abord un compte chez ce fournisseur ». Le client exécute le processus de liaison de ce fournisseur, puis renvoie cette étape avec l'action `refresh`. |
| `LinkRedirect` | `HostCallback` : le navigateur revient à `LinkStartContext.HostCallbackUrl`. `Capture` : une WebView mobile intercepte la première URL commençant par `CallbackPrefix`, puis envoie `callbackUrl` et `cookies` pour `CaptureCookieDomains`. |
| `LinkedAccountSummary` | Ligne renvoyée par `ListAccountsAsync` : `Status` (`Ok`, `Syncing`, `Expired`, `Error` ; les clients interrogent le serveur tant que le statut est `Syncing`) et `LastSyncedAt` optionnel. |

Les records positionnels et les enums :

```csharp
public enum LinkPlatform { Web, Mobile }
[Flags] public enum LinkPlatforms { None = 0, Web = 1, Mobile = 2, All = Web | Mobile }
public enum LinkStepKind { Form, Otp, PushCode, DeviceCode, Redirect, Select, Done, Error }
public enum LinkFieldType { Text, Email, Password, Select, Url, TotpSecret }
public enum LinkRedirectMode { HostCallback, Capture }
public enum LinkedAccountStatus { Ok, Syncing, Expired, Error }

public sealed record ProviderCapability(string Kind, string Label, string? Icon, string? BasePath);
public sealed record LinkStartContext(Guid ApplicationUserId, string FlowId, LinkPlatform Platform, string? ReauthAccountId, string HostCallbackUrl);
public sealed record LinkSubmitContext(Guid ApplicationUserId, string FlowId, LinkPlatform Platform, string StepId, string? State, IReadOnlyDictionary<string, string> Values, string? Action, string? ReauthAccountId, string HostCallbackUrl);
public sealed record LinkPollContext(Guid ApplicationUserId, string FlowId, LinkPlatform Platform, string StepId, string? State, string? ReauthAccountId);
public sealed record LinkStepResult(LinkStep Step, string? State);
public sealed record LinkOption(string Value, string Label, string? Detail = null, string? Icon = null) { public string? LinkProviderId { get; init; } }
public sealed record LinkAction(string Id, string Label);
public sealed record LinkOtp(int Length, string? Label, bool NumericOnly = true);
public sealed record LinkPushCode(string? Number, DateTimeOffset ExpiresAt, int PollIntervalSeconds);
public sealed record LinkDeviceCode(string UserCode, string VerificationUri, DateTimeOffset ExpiresAt, int PollIntervalSeconds);
public sealed record LinkRedirect(string Url, LinkRedirectMode Mode, string? CallbackPrefix, IReadOnlyList<string> CaptureCookieDomains);
public sealed record LinkDone(string AccountId, string? Title);
public sealed record LinkedAccountSummary(string Id, string Title, string? Detail, LinkedAccountStatus Status, DateTimeOffset? LinkedAt, string? Message, DateTimeOffset? LastSyncedAt = null);
```

### Règles de sécurité

- L'hôte transporte `State` (chiffré, en mémoire, 10 minutes au maximum) et ne l'envoie jamais aux clients.
  Il ne doit jamais contenir de mots de passe ni d'autres secrets saisis par l'utilisateur.
- Ni l'hôte ni le plugin ne journalisent ni ne stockent les champs avec `Secret = true`, ni aucune valeur
  envoyée. Ne mets pas de valeurs envoyées dans les messages d'erreur.
- Les secrets saisis par l'utilisateur (mots de passe, secrets TOTP, codes OTP, jetons de rafraîchissement)
  ne doivent jamais être journalisés, enregistrés en clair ni placés dans `State`. Les cookies capturés sont
  aussi des secrets, donc ne les journalise jamais.
- Les redirections `Capture` sont réservées au mobile. L'hôte les refuse pour la plateforme web. Utilise
  `HostCallback` uniquement quand le fournisseur renvoie vraiment le navigateur vers l'hôte.
- Les URL de vérification et de redirection doivent être en https.

### Validateurs

L'hôte utilise ces helpers purs, qui n'ont pas de dépendances :

- `LinkStepValidator.Validate(LinkStep step, IReadOnlyDictionary<string, string> values, string? action)`
  contrôle un envoi par rapport à l'étape courante.
  - Il refuse les clés inconnues.
  - Il applique les champs obligatoires, `MaxLength` (2048 par défaut), `Pattern` (délai de 100 ms), la forme
    de l'e-mail, les URL https (http uniquement pour localhost) et les options de sélection (sauf avec
    `AllowCustom`).
  - Une étape Otp prend la clé `code` (exactement `Length` caractères, des chiffres si `NumericOnly`). Une
    étape Select prend la clé `value`. Une redirection Capture prend `callbackUrl` et `cookies` en option.
  - `action` doit être l'une des actions de l'étape ou l'une des valeurs réservées `refresh` ou `cancel`.
    Avec une action, les contrôles des champs obligatoires sont ignorés.
  - Les messages nomment les clés des champs, jamais les valeurs.
- `LinkDescriptorValidator.ValidateDescriptor(LinkProviderDescriptor)` et
  `ValidateStep(LinkStep, LinkPlatform)` contrôlent les id, les clés, les URL en https uniquement et Capture
  sur le web. `IsValidId(string?)` et `IsValidFieldKey(string?)` contrôlent un seul id ou une seule clé.

Les deux validateurs renvoient `LinkValidationResult` :

```csharp
public sealed record LinkValidationResult(bool IsValid, IReadOnlyList<string> Errors);
```

Sa propriété `Valid` est le résultat de réussite, et `FromErrors(errors)` construit un résultat à partir d'une
liste d'erreurs.

Voir [versionnement](versioning.md) pour les règles qui encadrent les changements de chacun de ces membres.
