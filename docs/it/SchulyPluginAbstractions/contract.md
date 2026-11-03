# Riferimento del contratto

Usa questa pagina per consultare ogni interfaccia e record del contratto dei plugin.

Il pacchetto ha come target `net10.0`. I tipi si trovano nel namespace `Schuly.Plugin.Abstractions`, tranne i
tipi di collegamento (`ILinkProvider` e correlati), che si trovano in `Schuly.Plugin.Abstractions.Linking`. Le
firme qui sotto corrispondono al codice sorgente in
[`src/Schuly.Plugin.Abstractions/`](https://github.com/schulydev/SchulyPluginAbstractions/tree/main/src/Schuly.Plugin.Abstractions).

I plugin non toccano mai le entità o il database del backend. L'host registra questi servizi nel
container di ogni plugin:

| Servizio | Scopo |
|---|---|
| `IPluginUserContext` | L'utente corrente e lo school user |
| `ISchoolData` | Scrive i dati scolastici |
| `IPluginVault` | L'archivio cifrato dei segreti, proprio del plugin |
| `IPluginFileStore` | Salva i file scaricati nello storage dei documenti di Schuly |
| `ILinkedAccounts` | Gli account che un utente ha collegato con un provider esterno, condivisi da tutti i plugin |

L'host fornisce anche `ILogger<T>`, `IHttpClientFactory`, `IHttpContextAccessor` e `IConfiguration`.

Un plugin conserva il proprio stato, come account e cursori di sincronizzazione, nel proprio database tramite
`PluginServiceContext.ConnectionString`.

## `ISchulyPlugin`

Il punto di ingresso del plugin. L'host crea un'istanza per ogni plugin e la guida attraverso il ciclo di vita. Chiama
i metodi nell'ordine mostrato nella tabella.

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

| Membro | Scopo | Quando |
|---|---|---|
| `Name` | Identificatore stabile del plugin. L'host ne ricava il nome del database del plugin, il namespace del vault e il prefisso delle variabili d'ambiente. | Letto al caricamento. |
| `Version` | La stringa di versione propria del plugin. | Letta al caricamento. |
| `ConfigureServices(IServiceCollection, PluginServiceContext)` | Registra servizi, handler e opzioni nel container di servizi proprio del plugin. | Per primo, mentre l'host costruisce il container del plugin. |
| `MigrateAsync(IServiceProvider, CancellationToken)` | Esegue le migrazioni EF Core di proprietà del plugin (`db.Database.MigrateAsync()`). | Per secondo, dopo la costruzione del container del plugin. |
| `ConfigureEndpoints(IEndpointRouteBuilder)` | Mappa gli endpoint HTTP del plugin. | Per terzo, dopo le migrazioni. |

### `PluginServiceContext`

Il contesto passato a `ConfigureServices`.

```csharp
public record PluginServiceContext(string ConnectionString, IConfiguration Configuration);
```

| Membro | Scopo |
|---|---|
| `ConnectionString` | La connection string del database del plugin. L'host dà a ogni plugin il proprio database. |
| `Configuration` | L'`IConfiguration` dell'host, con sopra il file `<AssemblyName>.yml` del plugin e le variabili d'ambiente `SCHULY_PLUGIN_<NAME>_`. |

## `IPluginBackgroundTask`

Lavoro ricorrente in background. Lo scheduler dell'host esegue `ExecuteAsync` secondo lo `Schedule` del task. Un task non si
sovrappone mai a se stesso.

```csharp
public interface IPluginBackgroundTask
{
    string Name { get; }
    PluginSchedule Schedule { get; }
    Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken);
}
```

| Membro | Scopo |
|---|---|
| `Name` | Identificatore del task, per logging e diagnostica. L'host lo usa anche per trovare il task e come chiave per sovrascrivere la pianificazione, quindi tienilo stabile e univoco all'interno del plugin. |
| `Schedule` | La pianificazione predefinita del task. L'operatore dell'host può sovrascrivere la frequenza. |
| `ExecuteAsync(IServiceProvider, CancellationToken)` | Una singola esecuzione del lavoro. Risolvi i servizi scoped da `serviceProvider`. |

### `PluginSchedule`

La pianificazione predefinita del plugin per un task in background, come valore indipendente dallo scheduler e senza dipendenze
oltre la BCL. L'host la mappa sul proprio scheduler, e l'operatore dell'host può sovrascrivere la frequenza per ogni
deployment. Considera questi valori come un'impostazione predefinita, non come una garanzia.

```csharp
public sealed record PluginSchedule(string Cron, int Retries = 0, IReadOnlyList<TimeSpan>? RetryIntervals = null, bool RunOnStartup = false)
```

| Membro | Scopo |
|---|---|
| `Cron` | Espressione cron standard a 5 campi (`minute hour day-of-month month day-of-week`). Viene convalidata nel costruttore e a ogni espressione `with`. Un'espressione non valida lancia `ArgumentException`. |
| `Retries` | Numero di volte in cui l'host riprova un'esecuzione fallita. Deve essere `>= 0`, altrimenti lancia `ArgumentOutOfRangeException`. |
| `RetryIntervals` | Attesa prima di ogni nuovo tentativo. Se i tentativi sono più degli intervalli, l'host riusa l'ultimo intervallo per i tentativi rimanenti. `null` significa che vale il valore predefinito dell'host. Un intervallo negativo lancia `ArgumentOutOfRangeException`. |
| `RunOnStartup` | Indica se l'host esegue il task anche una volta subito all'avvio. |

| Factory | Produce |
|---|---|
| `Every(TimeSpan interval)` | Una pianificazione a intervallo fisso. Accetta solo minuti interi divisori di 60 (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60) oppure ore intere divisori di 24 (1, 2, 3, 4, 6, 8, 12, 24). Qualsiasi altro valore non si può esprimere come vero cron a frequenza fissa e lancia `ArgumentOutOfRangeException`. |
| `Daily(int hour, int minute = 0)` | Una pianificazione che scatta una volta al giorno alle `hour:minute`. Un valore fuori intervallo lancia `ArgumentOutOfRangeException`. |
| `Hourly(int minute = 0)` | Una pianificazione che scatta una volta all'ora al minuto `minute`. Un valore fuori intervallo lancia `ArgumentOutOfRangeException`. |

```csharp
public sealed class SyncTimetableTask : IPluginBackgroundTask
{
    public string Name => "schulware.sync-timetable";
    public PluginSchedule Schedule => PluginSchedule.Every(TimeSpan.FromMinutes(30));

    public Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken) => Task.CompletedTask;
}
```

Per una pianificazione che le factory non possono esprimere, costruisci `PluginSchedule` direttamente con una stringa cron e,
se vuoi, con un comportamento di retry:

```csharp
public PluginSchedule Schedule => new("0 6 * * MON-FRI", Retries: 3, RetryIntervals: [TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5)]);
```

## `IPluginEventHandler<TCommand>`

Reagisce a un comando o a un evento del backend. `TCommand` è controvariante (`in TCommand`). Registra l'handler in
`ConfigureServices`. Se un handler lancia un'eccezione, l'host registra l'errore e continua con gli altri handler.

```csharp
public interface IPluginEventHandler<in TCommand>
{
    Task HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}
```

| Membro | Scopo |
|---|---|
| `HandleAsync(TCommand, CancellationToken)` | Gestisce un comando inviato. |

### `PluginUserPurgeEvent`

L'host invia questo evento quando un utente Schuly viene eliminato. Gestiscilo con
`IPluginEventHandler<PluginUserPurgeEvent>` per cancellare i dati del plugin relativi a quell'utente: le sue righe di database
e i segreti del vault con chiave legata all'utente. L'host elimina da solo i dati di proprietà del core, ma può raggiungere lo
storage di un plugin solo tramite il plugin.

```csharp
public sealed record PluginUserPurgeEvent(Guid ApplicationUserId);
```

## `IPluginUserContext`

Legge l'utente corrente e lo school user dall'interno di un plugin.

```csharp
public interface IPluginUserContext
{
    Task<Guid> GetCurrentUserIdAsync(CancellationToken cancellationToken = default);
    Task<Guid?> GetCurrentSchoolUserIdAsync(CancellationToken cancellationToken = default);
}
```

| Membro | Scopo |
|---|---|
| `GetCurrentUserIdAsync(CancellationToken)` | L'id dell'utente corrente dell'applicazione. |
| `GetCurrentSchoolUserIdAsync(CancellationToken)` | L'id dello school user corrente, oppure `null` se non ce n'è nessuno nel contesto. |

## `IPluginLogin`

Il contratto di un plugin per collegare un account, e la fonte della sua voce nel catalogo dei sistemi scolastici.

1. Il plugin espone un descrittore `SchoolSystem`. L'host lo raccoglie da ogni plugin caricato e lo aggiunge
   al catalogo in base a `Key`, quindi l'operatore non fornisce nessuna configurazione del catalogo. Il nome visualizzato, il logo, lo stato
   di attivazione e l'ordine vengono inizializzati una sola volta. Le impostazioni di login seguono il plugin a ogni caricamento.
2. L'host espone un unico endpoint di login. Risolve l'`IPluginLogin` il cui `SystemKey` corrisponde al
   sistema richiesto e chiama `ConnectAsync` con i valori dei campi di login raccolti dall'app.
3. Il plugin legge l'utente corrente tramite `IPluginUserContext`, si autentica presso il suo provider,
   salva l'account e ne restituisce l'id. Nel backend non c'è nessuna autenticazione del provider.

```csharp
public interface IPluginLogin
{
    SchoolSystemDescriptor SchoolSystem { get; }

    string SystemKey => SchoolSystem.Key;

    Task<PluginLoginResult> ConnectAsync(IReadOnlyDictionary<string, string> fields, string? displayName, CancellationToken cancellationToken = default);
}
```

| Membro | Scopo |
|---|---|
| `SchoolSystem` | La voce del catalogo servita da questo login, che l'app mostra. Vedi `SchoolSystemDescriptor`. |
| `SystemKey` | La chiave di sistema del catalogo gestita da questo login, come `"schulnetz"`. È un membro predefinito che restituisce `SchoolSystem.Key`, quindi implementi solo `SchoolSystem`. |
| `ConnectAsync(IReadOnlyDictionary<string,string>, string?, CancellationToken)` | Collega un account dai campi di login raccolti, con le chiavi di `LoginFields` del descrittore (come `"email"`, `"password"`, `"baseUrl"`). `displayName` è un nome descrittivo facoltativo. |

### `SchoolSystemDescriptor`

Costruisci questo record nel tuo `IPluginLogin`.

| Membro | Scopo |
|---|---|
| `Key` | Obbligatorio. La chiave di sistema, come `"schulnetz"`. |
| `DisplayName` | Obbligatorio. Il nome mostrato dall'app. |
| `LoginMethod` | `"credentials"` (predefinito) o `"oauth-webview"`. |
| `LogoUrl` | Logo facoltativo. |
| `PrivateAuthStrategy` | `"token"` (un login headless crea un bearer token) o `"scrape"` (le credenziali vengono inviate di nuovo a ogni recupero). |
| `StatelessBasePath` | Endpoint della modalità privata, come `"/api/plugins/schulware/stateless"`. |
| `PluginBasePath` | Endpoint della modalità account, come `"/api/plugins/schulware"`. |
| `LoginMethodPath` | Endpoint anonimo che l'app chiama (GET, `?baseUrl=`) dopo l'inserimento dell'URL della scuola. Risponde con un `LoginMethodResult`. |
| `Enabled` | Indica se il sistema è attivo. Il valore predefinito è `true`. |
| `SortOrder` | Posizione nel catalogo. |
| `LoginFields` | Gli input `SchoolSystemLoginFieldDescriptor` che l'app mostra per raccogliere ciò che serve a `ConnectAsync`. |

La costante `SchoolSystemDescriptor.LinkedAccountFieldKey` (`"linkedAccountId"`) è il campo di login che
contiene l'id dell'account collegato scelto.

### `SchoolSystemLoginFieldDescriptor`

| Membro | Scopo |
|---|---|
| `Key` | Obbligatorio. Inviato con il valore raccolto, come `"baseUrl"`. |
| `Label` | Obbligatorio. L'etichetta del campo. |
| `Type` | `"url"`, `"text"` (predefinito) o `"password"`. |
| `Placeholder` | Placeholder facoltativo. |
| `DefaultValue` | Valore predefinito facoltativo. |
| `Required` | Il valore predefinito è `true`. |
| `ReplacedByLinkedAccount` | Nascosto quando la scuola fa accedere con un account collegato, come i campi di email, password e 2FA. |
| `Suggestions` | Valori noti che l'app propone di scegliere, come le scuole e i loro URL, in forma di `LoginFieldSuggestion`. L'utente può comunque inserire qualsiasi altro valore. |

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

### Metodo di login e accesso dal browser

```csharp
public sealed record LoginFieldSuggestion(string Label, string Value);
public sealed record LoginMethodResult(string? LinkedProvider) { public string? BrowserLoginPath { get; init; } }
public sealed record BrowserLoginStart(string AuthUrl, string CallbackUrl, string State, string Context, string? CompletePath) { public const string CallbackFieldKey = "browserCallbackUrl"; public const string ContextFieldKey = "browserContext"; }
```

`LoginMethodPath` risponde con un `LoginMethodResult`. Un `LinkedProvider` nullo senza `BrowserLoginPath` significa
credenziali normali.

- **Account collegato.** Imposta `LinkedProvider` quando la scuola fa accedere con un account collegato. L'app mostra
  gli account collegati di quel provider e invia `linkedAccountId` al posto dei campi contrassegnati con
  `ReplacedByLinkedAccount`.
- **Accesso dal browser.** Imposta `BrowserLoginPath` quando la scuola fa accedere tramite un browser, come per un
  login cantonale che nessun server può compilare. L'app nasconde i campi contrassegnati con `ReplacedByLinkedAccount` e invia con POST
  `{ "baseUrl": ... }` a `BrowserLoginPath`, che restituisce un `BrowserLoginStart`. L'app apre `AuthUrl`,
  attende un URL che inizia con `CallbackUrl` e il cui `state` corrisponde a `State`, e invia quell'URL e
  `Context` come campi `browserCallbackUrl` e `browserContext`: a `ConnectAsync` in modalità account, oppure
  a `CompletePath` in modalità privata.

### `PluginLoginResult`

L'esito di `ConnectAsync`.

```csharp
public record PluginLoginResult(bool Success, Guid? AccountId = null, string? Message = null);
```

| Membro | Scopo |
|---|---|
| `Success` | Indica se il collegamento è riuscito. |
| `AccountId` | L'id dell'account salvato, in caso di successo. |
| `Message` | Dettaglio facoltativo leggibile, come il motivo di un errore. |

## `ISchoolData`

L'accesso in scrittura del plugin ai dati scolastici di Schuly. L'host marca ogni riga con il plugin chiamante come
fonte e permette a un plugin di scrivere solo sugli studenti che ha creato. Scrivere su uno studente di un altro plugin lancia
`UnauthorizedAccessException`.

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

| Membro | Scopo |
|---|---|
| `EnsureSchoolAsync` | Trova una scuola in base al sito web (o al nome, se non ne ha uno) e la crea se manca. Restituisce il suo id. |
| `EnsureStudentAsync` | Trova il profilo studente dell'utente presso la scuola, lo crea se manca e compila i campi vuoti. Restituisce l'id dello school user. |
| `SyncAgendaAsync`, `SyncGradesAsync`, `SyncAbsencesAsync`, `SyncDocumentsAsync` | Eseguono l'upsert dei record in base a `ExternalId`: gli id sconosciuti vengono aggiunti, quelli noti aggiornati. Restituiscono `SyncResult(Added, Updated)`. |
| `SyncExamsAsync` | Esegue l'upsert degli esami in base a materia e nome. `ExamRecord` non ha un `ExternalId`. Restituisce `SyncResult(Added, Updated)`. |
| `SyncSemesterReportsAsync` | Esegue l'upsert delle pagelle semestrali in base a codice del programma, anno scolastico e semestre. Le materie di ogni pagella vengono sostituite in blocco. Restituisce `SyncResult(Added, Updated)`. |
| `GetDocumentIdsAsync` | Gli id esterni dei documenti che questo plugin ha già sincronizzato per lo studente, così può evitare di scaricarli di nuovo. |

`SyncGradesAsync` crea la materia (classe) e l'esame per ogni nota, se servono, e iscrive lo studente.
`SyncExamsAsync` fa lo stesso per gli esami che non hanno ancora una nota, come le prove future. Poiché un esame viene
abbinato in base a materia e nome, una nota successiva finisce sullo stesso esame. Gli host precedenti alla 0.8 ignorano
`SyncExamsAsync`: l'implementazione predefinita non fa nulla.

### Record

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

- **Gli orari sono `DateTimeOffset`.** Converti gli orari locali del provider con il fuso orario del provider prima di
  costruire un record. Schuly memorizza solo UTC. Una voce con sola data, come un giorno festivo o un'assenza di un giorno intero, inizia
  alla mezzanotte UTC del suo giorno.
- **`ExternalId` deve essere stabile** tra le sincronizzazioni per lo stesso elemento. Usa l'id del provider, se esiste,
  altrimenti una chiave costruita da campi che non cambiano. L'host rifiuta un id più lungo di 300
  caratteri con `ArgumentException`.
- **`GradeRecord`:** `Subject` diventa la classe, e `ExamName` l'esame al suo interno. `ClassAverage` è la
  media di classe riportata dalla scuola, quando ne pubblica una.
- **`ExamRecord`** corrisponde all'esame creato da un `GradeRecord` con gli stessi `Subject` e `Name`.
- **`AbsenceRecord.IsExcused`** indica se la scuola ha accettato una giustificazione. È `null` quando la scuola
  non lo indica.
- **`SemesterReportRecord`:** `SchoolYearStart` è l'anno in cui inizia l'anno scolastico (2025 per 25/26), e
  `SemesterHalf` è 1 o 2.
- **`SemesterSubjectRecord`** ha un `Grade` numerico, oppure un `Marker` come `"disp"` quando non c'è.
- **`DocumentRecord.File`** è ciò che ha restituito `IPluginFileStore.SaveAsync`, se hai scaricato il file.

## `IPluginVault`

L'archivio cifrato dei segreti del plugin, per token e credenziali. Ogni plugin ha il proprio namespace.
I valori sono cifrati a riposo (AES-256-GCM) e leggibili solo tramite questo vault.

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

Salva un file scaricato, come una pagella, nello storage cifrato dei documenti di Schuly. Passa lo `StoredFile`
restituito in un `DocumentRecord`, così l'app può scaricarlo.

```csharp
public interface IPluginFileStore
{
    Task<StoredFile> SaveAsync(Stream content, string fileName, string? contentType, CancellationToken cancellationToken = default);
}

public sealed record StoredFile(string Key, long SizeBytes);
```

## `ILinkedAccounts`

Gli account che un utente ha collegato con un provider di identità esterno, come Microsoft, condivisi da tutti i plugin: un
plugin collega l'account, un altro lo usa per accedere. Ogni chiamata è limitata all'utente indicato. I segreti sono
cifrati a riposo.

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

| Membro | Scopo |
|---|---|
| `SaveAsync` | Aggiunge l'account, oppure lo aggiorna se l'utente ha già collegato questo `ExternalId` presso il provider. |
| `RemoveAsync` | Rimuove l'account e i suoi segreti. |
| `LinkedProviders.Microsoft` | La chiave del provider `"microsoft"`. |
| `LinkedSecrets.RefreshToken` | Il nome del segreto `"refresh_token"`: il refresh token OAuth del provider. |
| `LinkedSecrets.SessionCookies` | Il nome del segreto `"session_cookies"`: la sessione di accesso del provider come array JSON di cookie `{domain, name, path, value}`. |

## `ILinkProvider`

Collegamento di account mostrato dall'host (namespace `Schuly.Plugin.Abstractions.Linking`, dalla versione 0.11). Un plugin dichiara
un descrittore e guida un flusso a più passaggi. L'host e i client mostrano i passaggi che il plugin restituisce, quindi nessun
client ha schermate specifiche di un plugin scritte nel codice. Registralo con
`services.AddScoped<ILinkProvider, XLinkProvider>()`.

L'host legge ogni descrittore una volta al caricamento. Registra nel log e salta un descrittore non valido o duplicato.

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

| Tipo | Scopo |
|---|---|
| `LinkProviderDescriptor` | `Id` (`^[a-z0-9][a-z0-9-]{1,40}$`), `DisplayName`, `Description`, `Icon`, `Capabilities`, `Flows`, `SortOrder`. |
| `LinkIcon` | `Lucide` (nome dell'icona in kebab-case, come `"graduation-cap"`) o `Svg` (markup inline). L'host sanifica l'SVG e lo serve dal proprio URL con un CSP rigoroso. |
| `ProviderCapability` | Una funzione sbloccata dagli account collegati del provider. I client includono interfacce generiche per ogni tipo e chiamano il plugin su `BasePath`. Tipi noti: `mail`, `chat`, `drive`, `notes`, `calendar`, `absence_reporting`, `school_data`. |
| `LinkFlowDescriptor` | `Id` (stesso pattern dell'id del provider), `Label`, `Description`, `Platforms` (`LinkPlatforms`, il valore predefinito è `All`). |
| `LinkStepResult(Step, State)` | Il passaggio successivo più lo stato opaco del plugin. `Done(accountId, title, state)` e `Fail(message)` costruiscono i passaggi finali. I loro id di passaggio sono `DoneStepId` (`"done"`) ed `ErrorStepId` (`"error"`). |
| `LinkStep` | `Id`, che il client rimanda all'invio. `Kind` (`Form`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Select`, `Done`, `Error`). `Title`, `Description`, `Error` inline e `SubmitLabel`. Il payload per il tipo: `Fields`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Options`, `Done`. `Actions` sono pulsanti alternativi, inviati come id dell'azione. |
| `LinkField` | Campo del modulo: `Key` (`^[A-Za-z][A-Za-z0-9_]{0,40}$`), `Label`, `Type`, `Placeholder`, `Help`, `DefaultValue`, `Required`, `Secret`, `MaxLength`, `Pattern` (regex .NET), `Options`, `AllowCustom`. |
| `LinkOption` | `LinkProviderId`, se impostato, significa "collega prima un account presso quel provider". Il client esegue il flusso di collegamento di quel provider, poi invia di nuovo questo passaggio con l'azione `refresh`. |
| `LinkRedirect` | `HostCallback`: il browser torna a `LinkStartContext.HostCallbackUrl`. `Capture`: una WebView mobile intercetta il primo URL che inizia con `CallbackPrefix`, poi invia `callbackUrl` e `cookies` per `CaptureCookieDomains`. |
| `LinkedAccountSummary` | Riga restituita da `ListAccountsAsync`: `Status` (`Ok`, `Syncing`, `Expired`, `Error`; i client eseguono il polling durante `Syncing`) e `LastSyncedAt` facoltativo. |

I record posizionali e gli enum:

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

### Regole di sicurezza

- L'host conserva `State` (cifrato, in memoria, per al massimo 10 minuti) e non lo invia mai ai client. Non deve
  mai contenere password o altri segreti inseriti dall'utente.
- Né l'host né il plugin registrano nei log o memorizzano i campi con `Secret = true`, né alcun valore inviato. Non
  mettere i valori inviati nei messaggi di errore.
- I segreti inseriti dall'utente (password, segreti TOTP, codici OTP, refresh token) non devono mai finire nei log, essere salvati in
  chiaro o messi in `State`. Anche i cookie catturati sono segreti, quindi non scriverli mai nei log.
- I redirect `Capture` sono solo per dispositivi mobili. L'host li rifiuta per la piattaforma web. Usa `HostCallback` solo
  quando il provider rimanda davvero il browser all'host.
- Gli URL di verifica e di redirect devono essere https.

### Validatori

L'host usa questi helper puri, che non hanno dipendenze:

- `LinkStepValidator.Validate(LinkStep step, IReadOnlyDictionary<string, string> values, string? action)`
  controlla un invio rispetto al passaggio corrente.
  - Rifiuta le chiavi sconosciute.
  - Applica i campi obbligatori, `MaxLength` (predefinito 2048), `Pattern` (timeout di 100 ms), la forma dell'email, gli URL https
    (http solo per localhost) e le opzioni di selezione (salvo `AllowCustom`).
  - Un passaggio Otp accetta la chiave `code` (esattamente `Length` caratteri, cifre se `NumericOnly`). Un passaggio Select accetta la chiave
    `value`. Un redirect Capture accetta `callbackUrl` e `cookies` facoltativo.
  - `action` deve essere una delle azioni del passaggio oppure una delle riservate `refresh` o `cancel`. Con un'azione, i
    controlli dei campi obbligatori vengono saltati.
  - I messaggi nominano le chiavi dei campi, mai i valori.
- `LinkDescriptorValidator.ValidateDescriptor(LinkProviderDescriptor)` e
  `ValidateStep(LinkStep, LinkPlatform)` controllano id, chiavi, URL solo https e Capture sul web.
  `IsValidId(string?)` e `IsValidFieldKey(string?)` controllano un singolo id o una singola chiave.

Entrambi i validatori restituiscono `LinkValidationResult`:

```csharp
public sealed record LinkValidationResult(bool IsValid, IReadOnlyList<string> Errors);
```

La sua proprietà `Valid` è il risultato di successo, e `FromErrors(errors)` costruisce un risultato da un elenco di errori.

Vedi [versionamento](versioning.md) per le regole che governano le modifiche a uno qualsiasi di questi membri.
