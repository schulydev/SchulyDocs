# Vertragsreferenz

Alles im Package liegt im Namespace `Schuly.Plugin.Abstractions` und zielt auf `net10.0`. Alle
Signaturen unten sind wortgetreu aus dem Quellcode unter `src/Schuly.Plugin.Abstractions/`
übernommen.

Plugins greifen nie auf die Entitäten oder die Datenbank des Backends zu. Der Host registriert
diese Services im Container jedes Plugins:

| Service | Zweck |
|---|---|
| `IPluginUserContext` | Der aktuelle User bzw. School-User |
| `ISchoolData` | Schuldaten schreiben (siehe unten) |
| `IPluginVault` | Der eigene verschlüsselte Secret-Speicher des Plugins |
| `IPluginFileStore` | Heruntergeladene Dateien im Dokumenten-Storage von Schuly speichern |

Ein Plugin hält seinen eigenen Zustand (Accounts, Sync-Cursor) über
`PluginServiceContext.ConnectionString` in seiner eigenen Datenbank.

## `ISchulyPlugin`

Der Plugin-Einstiegspunkt. Das Backend instanziiert pro Plugin eine Instanz und steuert sie
durch ihren Lebenszyklus.

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

| Member | Zweck | Wann |
|---|---|---|
| `Name` | Stabiler Plugin-Bezeichner. | Wird bei der Discovery gelesen. |
| `Version` | Eigener Versionsstring des Plugins. | Wird bei der Discovery gelesen. |
| `ConfigureServices(IServiceCollection, PluginServiceContext)` | Registriert Services, Handler und Options im DI-Container des Hosts. | Beim Start, bevor die App gebaut wird. |
| `ConfigureEndpoints(IEndpointRouteBuilder)` | Registriert die HTTP-Endpunkte des Plugins. | Beim Start, nachdem die Services gebaut wurden. |
| `MigrateAsync(IServiceProvider, CancellationToken)` | Führt die vom Plugin verwalteten EF-Core-Migrationen aus (`db.Database.MigrateAsync()`). | Beim Start, sobald der Service Provider verfügbar ist. |

### `PluginServiceContext`

Der Kontext, der an `ConfigureServices` übergeben wird.

```csharp
public record PluginServiceContext(string ConnectionString, IConfiguration Configuration);
```

| Member | Zweck |
|---|---|
| `ConnectionString` | Der Datenbank-Connection-String des Plugins (der Host isoliert jedes Plugin in seiner eigenen Datenbank). |
| `Configuration` | Die `IConfiguration` des Hosts, zum Lesen der Plugin-Optionen. |

## `IPluginBackgroundTask`

Wiederkehrende Hintergrundarbeit. Der `PluginBackgroundTaskHost` des Backends ruft
`ExecuteAsync` nach dem deklarierten `Schedule` des Tasks auf.

```csharp
public interface IPluginBackgroundTask
{
    string Name { get; }
    PluginSchedule Schedule { get; }
    Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken);
}
```

| Member | Zweck |
|---|---|
| `Name` | Bezeichner des Tasks (für Logging/Diagnose). |
| `Schedule` | Der Standard-Zeitplan des Tasks; der Betreiber des Hosts kann den Takt überschreiben. |
| `ExecuteAsync(IServiceProvider, CancellationToken)` | Eine Ausführung der Arbeit. Löse Scoped Services aus `serviceProvider` auf. |

### `PluginSchedule`

Der Standard-Zeitplan des Plugins für einen Hintergrund-Task, als Scheduler-unabhängiger Wert -
er hängt von nichts ausser der BCL ab. Der Host bildet ihn auf seinen eigenen Scheduler ab; der
Betreiber des Hosts kann den Takt pro Deployment überschreiben.

```csharp
public sealed record PluginSchedule(string Cron, int Retries = 0, IReadOnlyList<TimeSpan>? RetryIntervals = null, bool RunOnStartup = false)
```

| Member | Zweck |
|---|---|
| `Cron` | Standard-Cron-Ausdruck mit 5 Feldern (`minute hour day-of-month month day-of-week`). Der Konstruktor und jeder `with`-Ausdruck validieren ihn; ein ungültiger Ausdruck wirft `ArgumentException`. |
| `Retries` | Wie oft der Host eine fehlgeschlagene Ausführung wiederholt. Muss `>= 0` sein. |
| `RetryIntervals` | Wartezeit vor jeder Wiederholung. Gibt es mehr Wiederholungen als Intervalle, verwendet der Host das letzte Intervall für die restlichen Versuche. `null` bedeutet, dass der Standard-Backoff des Hosts gilt. |
| `RunOnStartup` | Ob der Host den Task beim Start zusätzlich einmal sofort ausführen soll. |

| Factory | Erzeugt |
|---|---|
| `Every(TimeSpan interval)` | Einen Zeitplan mit festem Intervall. Akzeptiert werden nur ganze Minuten, die 60 teilen (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60), oder ganze Stunden, die 24 teilen (1, 2, 3, 4, 6, 8, 12, 24) - alles andere lässt sich nicht als echter Cron mit festem Takt ausdrücken und wirft `ArgumentOutOfRangeException`. |
| `Daily(int hour, int minute = 0)` | Einen Zeitplan, der einmal täglich um `hour:minute` auslöst. |
| `Hourly(int minute = 0)` | Einen Zeitplan, der einmal pro Stunde bei `minute` auslöst. |

```csharp
public sealed class SyncTimetableTask : IPluginBackgroundTask
{
    public string Name => "schulware.sync-timetable";
    public PluginSchedule Schedule => PluginSchedule.Every(TimeSpan.FromMinutes(30));

    public Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken) => Task.CompletedTask;
}
```

Für einen Zeitplan, den die Factories nicht ausdrücken können, konstruiere `PluginSchedule`
direkt mit einem Cron-String und optional mit Retry-Verhalten:

```csharp
public PluginSchedule Schedule => new("0 6 * * MON-FRI", Retries: 3, RetryIntervals: [TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5)]);
```

## `IPluginEventHandler<TCommand>`

Reagiert auf einen Backend-Command. `TCommand` ist kontravariant (`in TCommand`).

```csharp
public interface IPluginEventHandler<in TCommand>
{
    Task HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}
```

| Member | Zweck |
|---|---|
| `HandleAsync(TCommand, CancellationToken)` | Behandelt einen versendeten Command. |

## `IPluginUserContext`

Liest den aktuellen User bzw. School-User aus dem Plugin heraus.

```csharp
public interface IPluginUserContext
{
    Task<Guid> GetCurrentUserIdAsync(CancellationToken cancellationToken = default);
    Task<Guid?> GetCurrentSchoolUserIdAsync(CancellationToken cancellationToken = default);
}
```

| Member | Zweck |
|---|---|
| `GetCurrentUserIdAsync(CancellationToken)` | Die Id des aktuellen Anwendungs-Users. |
| `GetCurrentSchoolUserIdAsync(CancellationToken)` | Die aktuelle School-User-Id, oder `null`, wenn keine im Kontext vorhanden ist. |

## `IPluginLogin`

Der Account-Connect-Vertrag eines Plugins - **und die Quelle seines Schulsystem-Katalogeintrags**.
Das Plugin stellt einen `SchoolSystem`-Descriptor bereit; das Backend sammelt ihn von jedem
geladenen Plugin und befüllt damit den Katalog (seed-if-missing anhand von `Key`), sodass der
Betreiber keine Katalogkonfiguration mehr liefert. Das Backend stellt anschliessend einen
einzigen, einheitlichen Login-Endpunkt bereit, löst das `IPluginLogin` auf, dessen `SystemKey`
mit dem angeforderten System übereinstimmt, und ruft `ConnectAsync` mit den Login-Feldwerten auf,
die die App gemäss diesem Descriptor gesammelt hat. Das Plugin liest den aktuellen User über
`IPluginUserContext`, authentifiziert sich bei seinem Provider, persistiert den Account und gibt
dessen Id zurück. Im Backend liegt keine Provider-Authentifizierung.

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

| Member | Zweck |
|---|---|
| `SchoolSystem` | Der Katalog-Descriptor, den die App rendert: `Key`, `DisplayName`, `LoginMethod`, `PrivateAuthStrategy` (`"token"`/`"scrape"`), `StatelessBasePath`, `PluginBasePath`, `SortOrder` und die von der App gesammelten `LoginFields`. |
| `SystemKey` | Der Katalog-Systemschlüssel, den dieses Login bedient, z. B. `"schulnetz"`. Default-Member, der `SchoolSystem.Key` zurückgibt; du implementierst nur `SchoolSystem`. |
| `ConnectAsync(IReadOnlyDictionary<string,string>, string?, CancellationToken)` | Verbindet einen Account anhand der gesammelten Login-Felder, geschlüsselt nach den `LoginFields`-Keys des Descriptors (z. B. `"email"`, `"password"`, `"baseUrl"`). `displayName` ist ein optionaler Anzeigename. |

`SchoolSystemDescriptor` (und dessen `LoginFields` vom Typ `SchoolSystemLoginFieldDescriptor`)
liegen in `Schuly.Plugin.Abstractions`; baue sie in deinem `IPluginLogin` auf:

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

`LoginMethodPath` antwortet mit einem `LoginMethodResult`. Setze `LinkedProvider`, wenn sich die Schule mit einem verknüpften Account anmeldet, oder `BrowserLoginPath`, wenn sie sich über einen Browser anmeldet (zum Beispiel ein kantonales Login, das kein Server ausfüllen kann). Die App sendet `{ "baseUrl": ... }` per POST an `BrowserLoginPath` und erhält ein `BrowserLoginStart(AuthUrl, CallbackUrl, State, Context, CompletePath)`. Sie öffnet `AuthUrl`, wartet auf eine URL, die mit `CallbackUrl` beginnt und deren `state` übereinstimmt, und übermittelt diese URL und `Context` als Felder `browserCallbackUrl` und `browserContext`: im Account-Modus an `ConnectAsync`, im privaten Modus an `CompletePath`.

`Suggestions` listet bekannte Werte auf, die die App zur Auswahl anbietet, als
`LoginFieldSuggestion(Label, Value)`. Der User kann weiterhin jeden anderen Wert eingeben.

### `PluginLoginResult`

Ergebnis von `ConnectAsync`.

```csharp
public record PluginLoginResult(bool Success, Guid? AccountId = null, string? Message = null);
```

| Member | Zweck |
|---|---|
| `Success` | Ob der Connect erfolgreich war. |
| `AccountId` | Die persistierte Account-Id bei Erfolg. |
| `Message` | Optionales, menschenlesbares Detail (z. B. ein Fehlergrund). |

## `ISchoolData`

Der Schreibzugriff des Plugins auf die Schuldaten von Schuly. Der Host versieht jede Zeile mit dem
aufrufenden Plugin als Quelle und lässt ein Plugin nur zu Schülern schreiben, die es selbst
angelegt hat.

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

| Member | Zweck |
|---|---|
| `EnsureSchoolAsync` | Sucht eine Schule anhand der Website (oder des Namens) und legt sie an, falls sie fehlt. Gibt ihre Id zurück. |
| `EnsureStudentAsync` | Sucht das Schülerprofil des Users an der Schule, legt es an, falls es fehlt, und füllt leere Felder. Gibt die School-User-Id zurück. |
| `Sync*Async` | Führt einen Upsert der Records anhand von `ExternalId` aus: Unbekannte Ids kommen neu dazu, bekannte werden aktualisiert. Gibt `SyncResult(Added, Updated)` zurück. |
| `GetDocumentIdsAsync` | Externe Ids bereits synchronisierter Dokumente, damit ein Plugin das erneute Herunterladen überspringen kann. |
| `SyncSemesterReportsAsync` | Führt einen Upsert der Semesterberichte anhand von Programmcode, Schuljahr und Halbjahr aus; die Fächer jedes Berichts werden als Ganzes ersetzt. |

`SyncGradesAsync` legt bei Bedarf das Fach (die Klasse) und die Prüfung für jede Note an und
schreibt den Schüler darin ein. `SyncExamsAsync` macht dasselbe für Prüfungen ohne Note (zum
Beispiel anstehende Tests); eine Prüfung wird anhand von Fach und Name zugeordnet, sodass eine
spätere Note bei derselben Prüfung landet. Hosts älter als 0.8 ignorieren es (die
Default-Implementierung macht nichts).

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

`StudentRecord` hat optionale Init-only-Profilfelder (`FirstName`, `LastName`, `Email`,
`PrivateEmail`, `PhoneNumber`, `Street`, `City`, `Zip`, `Birthday`, `EntryDate`, `LeaveDate`,
`ProfilePictureUrl`).

**Zeiten sind `DateTimeOffset`.** Rechne Ortszeiten des Providers mit dessen Zeitzone um, bevor
du einen Record baust; Schuly speichert nur UTC. Ein Eintrag nur mit Datum (ein Feiertag, eine
ganztägige Absenz) beginnt um Mitternacht UTC seines Tages.

**`ExternalId` muss über Syncs hinweg stabil sein** für dasselbe Element - die eigene Id des
Providers, falls es eine gibt, sonst ein Schlüssel aus Feldern, die sich nicht ändern.

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

Jedes Plugin erhält seinen eigenen Namespace; die Werte sind im Ruhezustand verschlüsselt
(AES-256-GCM) und nur über diesen Vault lesbar.

## `IPluginFileStore`

```csharp
public interface IPluginFileStore
{
    Task<StoredFile> SaveAsync(Stream content, string fileName, string? contentType, CancellationToken cancellationToken = default);
}

public sealed record StoredFile(string Key, long SizeBytes);
```

Speichert eine heruntergeladene Datei im verschlüsselten Dokumenten-Storage von Schuly. Übergib
das zurückgegebene `StoredFile` in einem `DocumentRecord`, damit die App es herunterladen kann.

## `ILinkProvider`

Vom Host gerendertes Verknüpfen von Accounts (Namespace `Schuly.Plugin.Abstractions.Linking`,
seit 0.11). Ein Plugin deklariert einen Descriptor und steuert einen mehrstufigen Ablauf; der Host
und die Clients rendern die Schritte, die es zurückgibt, sodass kein Client Plugin-spezifische
Screens hartcodiert. Registriere ihn mit `services.AddScoped<ILinkProvider, XLinkProvider>()`.

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

| Typ | Zweck |
|---|---|
| `LinkProviderDescriptor` | `Id` (`^[a-z0-9][a-z0-9-]{1,40}$`), `DisplayName`, `Icon` (`LinkIcon`: Lucide-Name oder SVG), `Capabilities` (`ProviderCapability(Kind, Label, Icon, BasePath)`), `Flows` (`LinkFlowDescriptor`, mit `LinkPlatforms`) |
| `LinkStepResult(Step, State)` | Nächster Schritt plus opaker Plugin-State. `Done(accountId, title, state)` und `Fail(message)` bauen die Endschritte |
| `LinkStep` | `Id`, `Kind` (`Form`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Select`, `Done`, `Error`), Inline-`Error` und die Nutzdaten für die jeweilige Art (`Fields`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Options`, `Actions`) |
| `LinkField` | Formularfeld: `Key` (`^[A-Za-z][A-Za-z0-9_]{0,40}$`), `Type`, `Required`, `Secret`, `MaxLength`, `Pattern`, `Options`, `AllowCustom` |
| `LinkRedirect` | `HostCallback` (der Browser kehrt zu `LinkStartContext.HostCallbackUrl` zurück) oder `Capture` (die mobile WebView fängt `CallbackPrefix` ab) |
| `LinkedAccountSummary` | Zeile, die `ListAccountsAsync` zurückgibt: `Status` (`Ok`, `Syncing`, `Expired`, `Error`; Clients pollen während `Syncing`) und optional `LastSyncedAt` |

Sicherheitsregeln:

- Der Host führt `State` mit (verschlüsselt, im Arbeitsspeicher, höchstens 10 Minuten) und sendet ihn nie an Clients. `State` darf nie Passwörter oder andere vom User eingegebene Secrets enthalten.
- Weder Host noch Plugin loggen oder speichern Felder mit `Secret = true` (und jeden übermittelten Wert). Schreibe übermittelte Werte nicht in Fehlermeldungen.
- `Capture`-Redirects gelten nur für Mobile; der Host lehnt sie für die Web-Plattform ab. Verwende `HostCallback` nur, wenn der Provider den Browser wirklich zum Host zurückschickt.
- Verifizierungs- und Redirect-URLs müssen https verwenden.

Reine Hilfsfunktionen, die der Host verwendet (keine Abhängigkeiten):

- `LinkStepValidator.Validate(LinkStep step, IReadOnlyDictionary<string, string> values, string? action)` prüft einen Submit gegen den aktuellen Schritt. Er lehnt unbekannte Keys ab und erzwingt Pflichtfelder, `MaxLength` (Standard 2048), `Pattern` (100 ms Timeout), E-Mail-Form, https-URL (http nur für localhost) und Select-Optionen (ausser bei `AllowCustom`). Ein Otp-Schritt nimmt den Key `code` (genau `Length` Zeichen, Ziffern bei `NumericOnly`); ein Select-Schritt nimmt den Key `value`; ein Capture-Redirect nimmt `callbackUrl` und optional `cookies`. `action` muss eine der Actions des Schritts oder das reservierte `refresh` / `cancel` sein. Meldungen nennen Feld-Keys, nie Werte.
- `LinkDescriptorValidator.ValidateDescriptor(LinkProviderDescriptor)` und `ValidateStep(LinkStep, LinkPlatform)` prüfen Ids, Keys, reine https-URLs und Capture im Web.

Beide geben `LinkValidationResult(bool IsValid, IReadOnlyList<string> Errors)` zurück.

---

Siehe [Versionierung](versioning.md) für die Regeln, die Änderungen an all diesen Mitgliedern
regeln.
