# Référence du contrat

Tout ce que contient le package vit dans le namespace `Schuly.Plugin.Abstractions` et cible
`net10.0`. Toutes les signatures ci-dessous sont recopiées telles quelles depuis le code source
sous `src/Schuly.Plugin.Abstractions/`.

Les plugins ne touchent jamais aux entités ni à la base de données du backend. L'hôte enregistre
ces services dans le conteneur de chaque plugin :

| Service | Rôle |
|---|---|
| `IPluginUserContext` | L'utilisateur courant / le school-user |
| `ISchoolData` | Écrit les données scolaires (voir ci-dessous) |
| `IPluginVault` | Le coffre-fort de secrets chiffré propre au plugin |
| `IPluginFileStore` | Enregistre les fichiers téléchargés dans le stockage de documents de Schuly |

Un plugin garde son propre état (comptes, curseurs de synchronisation) dans sa propre base de
données via `PluginServiceContext.ConnectionString`.

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
`ExecuteAsync` selon le `Schedule` déclaré par la tâche.

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
| `Name` | Identifiant de la tâche (pour le logging/diagnostic). |
| `Schedule` | Le planning par défaut de la tâche ; l'opérateur de l'hôte peut remplacer la cadence. |
| `ExecuteAsync(IServiceProvider, CancellationToken)` | Une exécution du travail. Résous les services scoped depuis `serviceProvider`. |

### `PluginSchedule`

Le planning par défaut du plugin pour une tâche en arrière-plan, sous forme de valeur
indépendante du planificateur - elle ne dépend de rien d'autre que la BCL. L'hôte la traduit
vers son propre planificateur ; l'opérateur de l'hôte peut remplacer la cadence par déploiement.

```csharp
public sealed record PluginSchedule(string Cron, int Retries = 0, IReadOnlyList<TimeSpan>? RetryIntervals = null, bool RunOnStartup = false)
```

| Membre | Rôle |
|---|---|
| `Cron` | Expression cron standard à 5 champs (`minute hour day-of-month month day-of-week`). Validée dans le constructeur et à chaque expression `with` ; une expression invalide lève `ArgumentException`. |
| `Retries` | Nombre de fois où l'hôte relance une exécution échouée. Doit être `>= 0`. |
| `RetryIntervals` | Délai avant chaque relance. S'il y a plus de relances que d'intervalles, l'hôte réutilise le dernier intervalle pour les tentatives restantes. `null` signifie que le backoff par défaut de l'hôte s'applique. |
| `RunOnStartup` | Indique si l'hôte doit aussi exécuter la tâche une fois immédiatement au démarrage. |

| Fabrique | Produit |
|---|---|
| `Every(TimeSpan interval)` | Un planning à intervalle fixe. Seuls les nombres entiers de minutes qui divisent 60 (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60) ou d'heures qui divisent 24 (1, 2, 3, 4, 6, 8, 12, 24) sont acceptés - tout le reste ne peut pas s'exprimer comme un vrai cron à cadence fixe et lève `ArgumentOutOfRangeException`. |
| `Daily(int hour, int minute = 0)` | Un planning qui se déclenche une fois par jour à `hour:minute`. |
| `Hourly(int minute = 0)` | Un planning qui se déclenche une fois par heure à `minute`. |

```csharp
public sealed class SyncTimetableTask : IPluginBackgroundTask
{
    public string Name => "schulware.sync-timetable";
    public PluginSchedule Schedule => PluginSchedule.Every(TimeSpan.FromMinutes(30));

    public Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken) => Task.CompletedTask;
}
```

Pour un planning que les fabriques ne peuvent pas exprimer, construis `PluginSchedule` directement
avec une chaîne cron et, en option, un comportement de relance :

```csharp
public PluginSchedule Schedule => new("0 6 * * MON-FRI", Retries: 3, RetryIntervals: [TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5)]);
```

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

`LoginMethodPath` répond par un `LoginMethodResult`. Définis `LinkedProvider` quand l'école se connecte avec un compte lié, ou `BrowserLoginPath` quand elle se connecte via un navigateur (par exemple une connexion cantonale qu'aucun serveur ne peut remplir). L'app envoie `{ "baseUrl": ... }` en POST à `BrowserLoginPath` et reçoit un `BrowserLoginStart(AuthUrl, CallbackUrl, State, Context, CompletePath)`. Elle ouvre `AuthUrl`, attend une URL qui commence par `CallbackUrl` et dont le `state` correspond, puis soumet cette URL et `Context` comme champs `browserCallbackUrl` et `browserContext` : à `ConnectAsync` en mode compte, ou à `CompletePath` en mode privé.

`Suggestions` liste des valeurs connues que l'app propose au choix, sous la forme `LoginFieldSuggestion(Label, Value)`.
L'utilisateur peut quand même saisir n'importe quelle autre valeur.

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

## `ISchoolData`

L'accès en écriture du plugin aux données scolaires de Schuly. L'hôte marque chaque ligne avec le
plugin appelant comme source et ne laisse un plugin écrire que pour les élèves qu'il a lui-même
provisionnés.

```csharp
public interface ISchoolData
{
    Task<Guid> EnsureSchoolAsync(SchoolRecord school, CancellationToken cancellationToken = default);
    Task<Guid> EnsureStudentAsync(Guid schoolId, Guid applicationUserId, StudentRecord student, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncAgendaAsync(Guid schoolUserId, IReadOnlyCollection<AgendaRecord> entries, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncGradesAsync(Guid schoolUserId, IReadOnlyCollection<GradeRecord> grades, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncExamsAsync(Guid schoolUserId, IReadOnlyCollection<ExamRecord> exams, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncAbsencesAsync(Guid schoolUserId, IReadOnlyCollection<AbsenceRecord> absences, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncDocumentsAsync(Guid schoolUserId, IReadOnlyCollection<DocumentRecord> documents, CancellationToken cancellationToken = default);
    Task<IReadOnlySet<string>> GetDocumentIdsAsync(Guid schoolUserId, CancellationToken cancellationToken = default);
    Task<SyncResult> SyncSemesterReportsAsync(Guid schoolUserId, IReadOnlyCollection<SemesterReportRecord> reports, CancellationToken cancellationToken = default);
}
```

| Membre | Rôle |
|---|---|
| `EnsureSchoolAsync` | Trouve une école par son site web (ou son nom) et la crée si elle manque. Retourne son id. |
| `EnsureStudentAsync` | Trouve le profil d'élève de l'utilisateur dans l'école, le crée s'il manque et remplit les champs vides. Retourne l'id du school-user. |
| `Sync*Async` | Fait un upsert des enregistrements par `ExternalId` : les ids inconnus sont ajoutés, les ids connus mis à jour. Retourne `SyncResult(Added, Updated)`. |
| `GetDocumentIdsAsync` | Ids externes des documents déjà synchronisés, pour qu'un plugin puisse éviter de les télécharger à nouveau. |
| `SyncSemesterReportsAsync` | Fait un upsert des bulletins semestriels par code de programme, année scolaire et semestre ; les branches de chaque bulletin sont remplacées d'un bloc. |

`SyncGradesAsync` crée au besoin la branche (classe) et l'examen de chaque note et y inscrit
l'élève. `SyncExamsAsync` fait de même pour les examens qui n'ont pas encore de note (par exemple
les tests à venir) ; un examen est identifié par sa branche et son nom, donc une note ultérieure
arrive sur le même examen. Les hôtes antérieurs à 0.8 l'ignorent (l'implémentation par défaut ne
fait rien).

### Records

```csharp
public sealed record SchoolRecord(string Name, string? Website = null, string? LogoUrl = null);
public sealed record AgendaRecord(string ExternalId, AgendaKind Kind, string Title, DateTimeOffset Start, DateTimeOffset? End = null, string? Place = null, string? Description = null);
public sealed record GradeRecord(string ExternalId, string Subject, string ExamName, decimal Score, decimal Weight = 1, DateOnly? ExamDate = null) { public decimal? ClassAverage { get; init; } }
public sealed record ExamRecord(string Subject, string Name, DateOnly Date) { public string? Description { get; init; } public decimal? ClassAverage { get; init; } }
public sealed record AbsenceRecord(string ExternalId, DateTimeOffset From, DateTimeOffset Until, string? Reason = null, bool IsLate = false) { public bool? IsExcused { get; init; } }
public sealed record DocumentRecord(string ExternalId, string Title, string? FileName = null, string? Category = null, string? Comment = null, string? EnteredBy = null, StoredFile? File = null);
public enum AgendaKind { Event = 0, Lesson = 1, Test = 2, Holiday = 3 }
public sealed record SemesterReportRecord(string ProgramCode, int SchoolYearStart, int SemesterHalf, string ClassName, IReadOnlyList<SemesterSubjectRecord> Subjects, string? PromotionDecision = null, decimal? GradeAverage = null, int? ExcusedAbsences = null, int? UnexcusedAbsences = null);
public sealed record SemesterSubjectRecord(string SubjectCode, string SubjectName, decimal? Grade = null, string? Marker = null, string? SubjectTypeMarker = null);
```

`StudentRecord` possède des champs de profil optionnels init-only (`FirstName`, `LastName`, `Email`,
`PrivateEmail`, `PhoneNumber`, `Street`, `City`, `Zip`, `Birthday`, `EntryDate`, `LeaveDate`,
`ProfilePictureUrl`).

**Les heures sont des `DateTimeOffset`.** Convertis les heures locales du fournisseur avec son
fuseau horaire avant de construire un record ; Schuly ne stocke que de l'UTC. Une entrée sans
heure (un jour férié, une absence d'une journée entière) commence à minuit UTC de son jour.

**`ExternalId` doit rester stable** d'une synchronisation à l'autre pour un même élément - l'id
propre au fournisseur s'il existe, sinon une clé construite à partir de champs qui ne changent pas.

## `IPluginVault`

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

Chaque plugin reçoit son propre espace de noms ; les valeurs sont chiffrées au repos (AES-256-GCM)
et lisibles uniquement via ce coffre-fort.

## `IPluginFileStore`

```csharp
public interface IPluginFileStore
{
    Task<StoredFile> SaveAsync(Stream content, string fileName, string? contentType, CancellationToken cancellationToken = default);
}

public sealed record StoredFile(string Key, long SizeBytes);
```

Enregistre un fichier téléchargé dans le stockage de documents chiffré de Schuly. Passe le
`StoredFile` retourné dans un `DocumentRecord` pour que l'app puisse le télécharger.

## `ILinkProvider`

Liaison de comptes rendue par l'hôte (namespace `Schuly.Plugin.Abstractions.Linking`, depuis 0.11).
Un plugin déclare un descripteur et pilote un flux en plusieurs étapes ; l'hôte et les clients
rendent les étapes qu'il retourne, donc aucun client ne code en dur des écrans propres à un plugin.
Enregistre-le avec `services.AddScoped<ILinkProvider, XLinkProvider>()`.

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
| `LinkProviderDescriptor` | `Id` (`^[a-z0-9][a-z0-9-]{1,40}$`), `DisplayName`, `Icon` (`LinkIcon` : nom Lucide ou SVG), `Capabilities` (`ProviderCapability(Kind, Label, Icon, BasePath)`), `Flows` (`LinkFlowDescriptor`, avec `LinkPlatforms`) |
| `LinkStepResult(Step, State)` | Étape suivante plus état opaque du plugin. `Done(accountId, title, state)` et `Fail(message)` construisent les étapes finales |
| `LinkStep` | `Id`, `Kind` (`Form`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Select`, `Done`, `Error`), `Error` en ligne, et les données propres au type (`Fields`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Options`, `Actions`) |
| `LinkField` | Champ de formulaire : `Key` (`^[A-Za-z][A-Za-z0-9_]{0,40}$`), `Type`, `Required`, `Secret`, `MaxLength`, `Pattern`, `Options`, `AllowCustom` |
| `LinkRedirect` | `HostCallback` (le navigateur revient à `LinkStartContext.HostCallbackUrl`) ou `Capture` (la WebView mobile intercepte `CallbackPrefix`) |
| `LinkedAccountSummary` | Ligne retournée par `ListAccountsAsync` : `Status` (`Ok`, `Syncing`, `Expired`, `Error` ; les clients interrogent tant que le statut est `Syncing`) et `LastSyncedAt` optionnel |

Règles de sécurité :

- `State` est transporté par l'hôte (chiffré, en mémoire, 10 minutes au maximum) et n'est jamais envoyé aux clients. Il ne doit jamais contenir de mots de passe ni d'autres secrets saisis par l'utilisateur.
- Les champs avec `Secret = true` (et toutes les valeurs soumises) ne sont jamais journalisés ni stockés par l'hôte ou le plugin. Ne mets pas de valeurs soumises dans les messages d'erreur.
- Les redirections `Capture` sont réservées au mobile ; l'hôte les rejette pour la plateforme web. Utilise `HostCallback` uniquement quand le fournisseur renvoie réellement le navigateur vers l'hôte.
- Les URL de vérification et de redirection doivent être en https.

Helpers purs utilisés par l'hôte (sans dépendances) :

- `LinkStepValidator.Validate(LinkStep step, IReadOnlyDictionary<string, string> values, string? action)` vérifie une soumission par rapport à l'étape courante. Les clés inconnues sont rejetées ; les champs requis, `MaxLength` (2048 par défaut), `Pattern` (délai de 100 ms), le format d'e-mail, les URL https (http uniquement pour localhost) et les options de sélection (sauf `AllowCustom`) sont imposés. Une étape Otp prend la clé `code` (exactement `Length` caractères, des chiffres si `NumericOnly`) ; une étape Select prend la clé `value` ; une redirection Capture prend `callbackUrl` et `cookies` en option. `action` doit être l'une des actions de l'étape ou les valeurs réservées `refresh` / `cancel`. Les messages nomment les clés des champs, jamais les valeurs.
- `LinkDescriptorValidator.ValidateDescriptor(LinkProviderDescriptor)` et `ValidateStep(LinkStep, LinkPlatform)` vérifient les ids, les clés, les URL https uniquement et Capture sur le web.

Les deux retournent `LinkValidationResult(bool IsValid, IReadOnlyList<string> Errors)`.

---

Voir [versionnement](versioning.md) pour les règles qui régissent les changements apportés à
l'un de ces membres.
