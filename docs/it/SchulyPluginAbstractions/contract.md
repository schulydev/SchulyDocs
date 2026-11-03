# Riferimento del contratto

Tutto ciò che contiene il pacchetto vive nel namespace `Schuly.Plugin.Abstractions` e ha come
target `net10.0`. Tutte le firme qui sotto sono copiate testualmente dal codice sorgente in
`src/Schuly.Plugin.Abstractions/`.

I plugin non toccano mai le entità o il database del backend. L'host registra questi servizi nel
container di ogni plugin:

| Servizio | Scopo |
|---|---|
| `IPluginUserContext` | L'utente corrente / lo school-user |
| `ISchoolData` | Scrive i dati scolastici (vedi sotto) |
| `IPluginVault` | Il vault cifrato dei segreti, proprio del plugin |
| `IPluginFileStore` | Salva i file scaricati nello storage dei documenti di Schuly |

Un plugin conserva il proprio stato (account, cursori di sincronizzazione) nel proprio database
tramite `PluginServiceContext.ConnectionString`.

## `ISchulyPlugin`

Il punto di ingresso del plugin. Il backend ne istanzia uno per ogni plugin e lo guida
attraverso il suo ciclo di vita.

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
| `Name` | Identificatore stabile del plugin. | Letto durante la discovery. |
| `Version` | Stringa di versione propria del plugin. | Letta durante la discovery. |
| `ConfigureServices(IServiceCollection, PluginServiceContext)` | Registra servizi, handler e opzioni nel container DI dell'host. | All'avvio, prima che l'app venga costruita. |
| `ConfigureEndpoints(IEndpointRouteBuilder)` | Mappa gli endpoint HTTP del plugin. | All'avvio, dopo che i servizi sono stati costruiti. |
| `MigrateAsync(IServiceProvider, CancellationToken)` | Esegue le migrazioni EF Core di proprietà del plugin (`db.Database.MigrateAsync()`). | All'avvio, non appena il service provider è disponibile. |

### `PluginServiceContext`

Il contesto passato a `ConfigureServices`.

```csharp
public record PluginServiceContext(string ConnectionString, IConfiguration Configuration);
```

| Membro | Scopo |
|---|---|
| `ConnectionString` | La connection string del database del plugin (l'host isola ogni plugin nel proprio database). |
| `Configuration` | L'`IConfiguration` dell'host, per leggere le opzioni del plugin. |

## `IPluginBackgroundTask`

Lavoro ricorrente in background. Il `PluginBackgroundTaskHost` del backend invoca `ExecuteAsync`
secondo lo `Schedule` dichiarato dal task.

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
| `Name` | Identificatore del task (per logging/diagnostica). |
| `Schedule` | La pianificazione predefinita del task; l'operatore dell'host può sovrascrivere la frequenza. |
| `ExecuteAsync(IServiceProvider, CancellationToken)` | Una singola esecuzione del lavoro. Risolvi i servizi scoped da `serviceProvider`. |

### `PluginSchedule`

La pianificazione predefinita del plugin per un task in background, come valore indipendente
dallo scheduler - non dipende da nulla oltre la BCL. L'host la mappa sul proprio scheduler;
l'operatore dell'host può sovrascrivere la frequenza per ogni deployment.

```csharp
public sealed record PluginSchedule(string Cron, int Retries = 0, IReadOnlyList<TimeSpan>? RetryIntervals = null, bool RunOnStartup = false)
```

| Membro | Scopo |
|---|---|
| `Cron` | Espressione cron standard a 5 campi (`minute hour day-of-month month day-of-week`). Viene convalidata nel costruttore e in ogni espressione `with`; un'espressione non valida lancia `ArgumentException`. |
| `Retries` | Numero di volte in cui l'host riprova un'esecuzione fallita. Deve essere `>= 0`. |
| `RetryIntervals` | Attesa prima di ogni nuovo tentativo. Se i tentativi sono più degli intervalli, l'host riusa l'ultimo intervallo per i tentativi rimanenti. `null` significa che si applica il backoff predefinito dell'host. |
| `RunOnStartup` | Indica se l'host deve eseguire il task anche una volta subito all'avvio. |

| Factory | Produce |
|---|---|
| `Every(TimeSpan interval)` | Una pianificazione a intervallo fisso. Sono accettati solo minuti interi divisori di 60 (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60) oppure ore intere divisori di 24 (1, 2, 3, 4, 6, 8, 12, 24) - qualsiasi altro valore non si può esprimere come vero cron a frequenza fissa e lancia `ArgumentOutOfRangeException`. |
| `Daily(int hour, int minute = 0)` | Una pianificazione che scatta una volta al giorno alle `hour:minute`. |
| `Hourly(int minute = 0)` | Una pianificazione che scatta una volta all'ora al minuto `minute`. |

```csharp
public sealed class SyncTimetableTask : IPluginBackgroundTask
{
    public string Name => "schulware.sync-timetable";
    public PluginSchedule Schedule => PluginSchedule.Every(TimeSpan.FromMinutes(30));

    public Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken) => Task.CompletedTask;
}
```

Per una pianificazione che le factory non possono esprimere, costruisci `PluginSchedule`
direttamente con una stringa cron e, facoltativamente, il comportamento dei nuovi tentativi:

```csharp
public PluginSchedule Schedule => new("0 6 * * MON-FRI", Retries: 3, RetryIntervals: [TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5)]);
```

## `IPluginEventHandler<TCommand>`

Reagisce a un comando del backend. `TCommand` è controvariante (`in TCommand`).

```csharp
public interface IPluginEventHandler<in TCommand>
{
    Task HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}
```

| Membro | Scopo |
|---|---|
| `HandleAsync(TCommand, CancellationToken)` | Gestisce un comando distribuito. |

## `IPluginUserContext`

Legge l'utente corrente / lo school-user dall'interno di un plugin.

```csharp
public interface IPluginUserContext
{
    Task<Guid> GetCurrentUserIdAsync(CancellationToken cancellationToken = default);
    Task<Guid?> GetCurrentSchoolUserIdAsync(CancellationToken cancellationToken = default);
}
```

| Membro | Scopo |
|---|---|
| `GetCurrentUserIdAsync(CancellationToken)` | L'id dell'utente applicativo corrente. |
| `GetCurrentSchoolUserIdAsync(CancellationToken)` | L'id dello school-user corrente, oppure `null` se nessuno è presente nel contesto. |

## `IPluginLogin`

Il contratto di connessione account di un plugin - **e la fonte della sua voce nel catalogo dei
sistemi scolastici**. Il plugin espone un descrittore `SchoolSystem`; il backend lo raccoglie
da ogni plugin caricato e popola il catalogo (seed-if-missing in base a `Key`), così
l'operatore non deve più fornire la configurazione del catalogo. Il backend espone quindi un
unico endpoint di login unificato, risolve l'`IPluginLogin` il cui `SystemKey` corrisponde al
sistema richiesto, e chiama `ConnectAsync` con i valori dei campi di login raccolti dall'app in
base a quel descrittore. Il plugin legge l'utente corrente tramite `IPluginUserContext`, si
autentica presso il proprio provider, salva l'account e ne restituisce l'id. Nessuna
autenticazione del provider risiede nel backend.

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

| Membro | Scopo |
|---|---|
| `SchoolSystem` | Il descrittore di catalogo che l'app renderizza: `Key`, `DisplayName`, `LoginMethod`, `PrivateAuthStrategy` (`"token"`/`"scrape"`), `StatelessBasePath`, `PluginBasePath`, `SortOrder` e i `LoginFields` raccolti dall'app. |
| `SystemKey` | La chiave di sistema del catalogo gestita da questo login, ad es. `"schulnetz"`. Membro predefinito che restituisce `SchoolSystem.Key`; implementi solo `SchoolSystem`. |
| `ConnectAsync(IReadOnlyDictionary<string,string>, string?, CancellationToken)` | Connette un account a partire dai campi di login raccolti, indicizzati dalle chiavi `LoginFields` del descrittore (ad es. `"email"`, `"password"`, `"baseUrl"`). `displayName` è un nome descrittivo opzionale. |

`SchoolSystemDescriptor` (e i suoi `LoginFields` di tipo `SchoolSystemLoginFieldDescriptor`)
vivono in `Schuly.Plugin.Abstractions`; costruiscili nel tuo `IPluginLogin`:

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

`LoginMethodPath` risponde con un `LoginMethodResult`. Imposta `LinkedProvider` quando la scuola accede con un account collegato, oppure `BrowserLoginPath` quando accede tramite un browser (ad esempio un login cantonale che nessun server può compilare). L'app invia con POST `{ "baseUrl": ... }` a `BrowserLoginPath` e riceve un `BrowserLoginStart(AuthUrl, CallbackUrl, State, Context, CompletePath)`. Apre `AuthUrl`, attende un URL che inizia con `CallbackUrl` e il cui `state` corrisponde, e invia quell'URL e `Context` come campi `browserCallbackUrl` e `browserContext`: a `ConnectAsync` in modalità account, oppure a `CompletePath` in modalità privata.

`Suggestions` elenca i valori noti che l'app propone di scegliere, come `LoginFieldSuggestion(Label, Value)`.
L'utente può comunque digitare qualsiasi altro valore.

### `PluginLoginResult`

Risultato di `ConnectAsync`.

```csharp
public record PluginLoginResult(bool Success, Guid? AccountId = null, string? Message = null);
```

| Membro | Scopo |
|---|---|
| `Success` | Indica se la connessione ha avuto successo. |
| `AccountId` | L'id dell'account salvato in caso di successo. |
| `Message` | Dettaglio opzionale leggibile da un umano (ad es. il motivo di un errore). |

## `ISchoolData`

L'accesso in scrittura del plugin ai dati scolastici di Schuly. L'host marca ogni riga con il
plugin chiamante come origine e permette a un plugin di scrivere solo sugli studenti che ha creato
lui stesso.

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

| Membro | Scopo |
|---|---|
| `EnsureSchoolAsync` | Trova una scuola tramite sito web (o nome) e la crea se manca. Restituisce il suo id. |
| `EnsureStudentAsync` | Trova il profilo studente dell'utente presso la scuola, lo crea se manca e compila i campi vuoti. Restituisce l'id dello school-user. |
| `Sync*Async` | Esegue l'upsert dei record tramite `ExternalId`: gli id sconosciuti vengono aggiunti, quelli noti aggiornati. Restituisce `SyncResult(Added, Updated)`. |
| `GetDocumentIdsAsync` | Gli id esterni dei documenti già sincronizzati, così un plugin può evitare di riscaricarli. |
| `SyncSemesterReportsAsync` | Esegue l'upsert dei report semestrali tramite codice del programma, anno scolastico e semestre; le materie di ogni report vengono sostituite in blocco. |

`SyncGradesAsync` crea la materia (classe) e l'esame di ogni voto quando serve e vi iscrive lo
studente. `SyncExamsAsync` fa lo stesso per gli esami che non hanno ancora un voto (ad esempio i
test in arrivo); un esame viene abbinato per materia e nome, così un voto successivo finisce sullo
stesso esame. Gli host precedenti alla 0.8 lo ignorano (l'implementazione predefinita non fa nulla).

### Record

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

`StudentRecord` ha campi di profilo opzionali init-only (`FirstName`, `LastName`, `Email`,
`PrivateEmail`, `PhoneNumber`, `Street`, `City`, `Zip`, `Birthday`, `EntryDate`, `LeaveDate`,
`ProfilePictureUrl`).

**Gli orari sono `DateTimeOffset`.** Converti gli orari locali del provider con il fuso orario del
provider prima di costruire un record; Schuly salva solo UTC. Una voce con sola data (una vacanza,
un'assenza di un giorno intero) inizia alla mezzanotte UTC del suo giorno.

**`ExternalId` deve essere stabile** tra una sincronizzazione e l'altra per lo stesso elemento -
l'id del provider, se esiste, altrimenti una chiave costruita da campi che non cambiano.

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

Ogni plugin ha il proprio namespace; i valori sono cifrati a riposo (AES-256-GCM) e leggibili
solo tramite questo vault.

## `IPluginFileStore`

```csharp
public interface IPluginFileStore
{
    Task<StoredFile> SaveAsync(Stream content, string fileName, string? contentType, CancellationToken cancellationToken = default);
}

public sealed record StoredFile(string Key, long SizeBytes);
```

Salva un file scaricato nello storage cifrato dei documenti di Schuly. Passa lo `StoredFile`
restituito in un `DocumentRecord`, così l'app può scaricarlo.

## `ILinkProvider`

Collegamento degli account renderizzato dall'host (namespace `Schuly.Plugin.Abstractions.Linking`, dalla 0.11). Un plugin
dichiara un descrittore e guida un flusso a più passaggi; l'host e i client renderizzano i passaggi che
restituisce, così nessun client cabla schermate specifiche di un plugin. Registralo con
`services.AddScoped<ILinkProvider, XLinkProvider>()`.

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
| `LinkProviderDescriptor` | `Id` (`^[a-z0-9][a-z0-9-]{1,40}$`), `DisplayName`, `Icon` (`LinkIcon`: nome Lucide o SVG), `Capabilities` (`ProviderCapability(Kind, Label, Icon, BasePath)`), `Flows` (`LinkFlowDescriptor`, con `LinkPlatforms`) |
| `LinkStepResult(Step, State)` | Passaggio successivo più lo stato opaco del plugin. `Done(accountId, title, state)` e `Fail(message)` costruiscono i passaggi terminali |
| `LinkStep` | `Id`, `Kind` (`Form`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Select`, `Done`, `Error`), `Error` inline e il payload per il tipo (`Fields`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Options`, `Actions`) |
| `LinkField` | Campo del modulo: `Key` (`^[A-Za-z][A-Za-z0-9_]{0,40}$`), `Type`, `Required`, `Secret`, `MaxLength`, `Pattern`, `Options`, `AllowCustom` |
| `LinkRedirect` | `HostCallback` (il browser torna a `LinkStartContext.HostCallbackUrl`) oppure `Capture` (la WebView mobile intercetta `CallbackPrefix`) |
| `LinkedAccountSummary` | Riga restituita da `ListAccountsAsync`: `Status` (`Ok`, `Syncing`, `Expired`, `Error`; i client eseguono il polling finché è `Syncing`) e `LastSyncedAt` opzionale |

Regole di sicurezza:

- `State` è custodito dall'host (cifrato, in memoria, al massimo 10 minuti) e non viene mai inviato ai client. Non deve mai contenere password o altri segreti inseriti dall'utente.
- L'host e il plugin non registrano nei log né salvano mai i campi con `Secret = true` (e ogni valore inviato). Non inserire i valori inviati nei messaggi di errore.
- I redirect `Capture` sono solo per mobile; l'host li rifiuta per la piattaforma web. Usa `HostCallback` solo quando il provider rimanda davvero il browser all'host.
- Gli URL di verifica e di redirect devono essere https.

Helper puri usati dall'host (senza dipendenze):

- `LinkStepValidator.Validate(LinkStep step, IReadOnlyDictionary<string, string> values, string? action)` controlla un invio rispetto al passaggio corrente. Le chiavi sconosciute vengono rifiutate; vengono applicati obbligatorietà, `MaxLength` (predefinito 2048), `Pattern` (timeout di 100 ms), forma dell'email, URL https (http solo per localhost), opzioni di selezione (salvo `AllowCustom`). Un passaggio Otp accetta la chiave `code` (esattamente `Length` caratteri, cifre se `NumericOnly`); un passaggio Select accetta la chiave `value`; un redirect Capture accetta `callbackUrl` e `cookies` opzionale. `action` deve essere una delle azioni del passaggio oppure i riservati `refresh` / `cancel`. I messaggi nominano le chiavi dei campi, mai i valori.
- `LinkDescriptorValidator.ValidateDescriptor(LinkProviderDescriptor)` e `ValidateStep(LinkStep, LinkPlatform)` controllano id, chiavi, URL solo https e Capture su web.

Entrambi restituiscono `LinkValidationResult(bool IsValid, IReadOnlyList<string> Errors)`.

---

Vedi [versionamento](versioning.md) per le regole che governano le modifiche a uno qualsiasi
di questi membri.
