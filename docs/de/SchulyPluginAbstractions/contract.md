# Vertragsreferenz

Nutze diese Seite, um jedes Interface und Record im Plugin-Vertrag nachzuschlagen.

Das Package zielt auf `net10.0`. Die Typen liegen im Namespace `Schuly.Plugin.Abstractions`, ausser den
Linking-Typen (`ILinkProvider` und verwandte), die in `Schuly.Plugin.Abstractions.Linking` liegen. Die
Signaturen unten entsprechen dem Quellcode in
[`src/Schuly.Plugin.Abstractions/`](https://github.com/schulydev/SchulyPluginAbstractions/tree/main/src/Schuly.Plugin.Abstractions).

Plugins greifen nie auf die Entitäten oder die Datenbank des Backends zu. Der Host registriert diese
Services im Container jedes Plugins:

| Service | Zweck |
|---|---|
| `IPluginUserContext` | Der aktuelle User und School-User |
| `ISchoolData` | Schuldaten schreiben |
| `IPluginVault` | Der eigene verschlüsselte Secret-Speicher des Plugins |
| `IPluginFileStore` | Heruntergeladene Dateien im Dokumenten-Storage von Schuly speichern |
| `ILinkedAccounts` | Konten, die ein User bei einem externen Provider verknüpft hat, von allen Plugins gemeinsam genutzt |

Der Host stellt auch `ILogger<T>`, `IHttpClientFactory`, `IHttpContextAccessor` und `IConfiguration` bereit.

Ein Plugin hält seinen eigenen Zustand, zum Beispiel Konten und Sync-Cursor, über
`PluginServiceContext.ConnectionString` in seiner eigenen Datenbank.

## `ISchulyPlugin`

Der Einstiegspunkt des Plugins. Der Host erstellt pro Plugin eine Instanz und führt sie durch den
Lebenszyklus. Er ruft die Methoden in der Reihenfolge der Tabelle auf.

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
| `Name` | Stabiler Plugin-Bezeichner. Der Host leitet daraus den Datenbanknamen, den Vault-Namespace und das Präfix der Umgebungsvariablen des Plugins ab. | Wird beim Laden gelesen. |
| `Version` | Der eigene Versionsstring des Plugins. | Wird beim Laden gelesen. |
| `ConfigureServices(IServiceCollection, PluginServiceContext)` | Registriert Services, Handler und Options im eigenen Service-Container des Plugins. | Zuerst, während der Host den Container des Plugins baut. |
| `MigrateAsync(IServiceProvider, CancellationToken)` | Führt die EF-Core-Migrationen des Plugins aus (`db.Database.MigrateAsync()`). | Als Zweites, nachdem der Container des Plugins gebaut ist. |
| `ConfigureEndpoints(IEndpointRouteBuilder)` | Registriert die HTTP-Endpunkte des Plugins. | Als Drittes, nach den Migrationen. |

### `PluginServiceContext`

Der Kontext, der an `ConfigureServices` übergeben wird.

```csharp
public record PluginServiceContext(string ConnectionString, IConfiguration Configuration);
```

| Member | Zweck |
|---|---|
| `ConnectionString` | Der Datenbank-Connection-String des Plugins. Der Host gibt jedem Plugin eine eigene Datenbank. |
| `Configuration` | Die `IConfiguration` des Hosts, überlagert mit der `<AssemblyName>.yml` des Plugins und den Umgebungsvariablen `SCHULY_PLUGIN_<NAME>_`. |

## `IPluginBackgroundTask`

Wiederkehrende Hintergrundarbeit. Der Scheduler des Hosts führt `ExecuteAsync` nach dem `Schedule` des Tasks
aus. Ein Task überschneidet sich nie mit sich selbst.

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
| `Name` | Task-Bezeichner für Logging und Diagnose. Der Host nutzt ihn auch, um den Task zu finden, und als Schlüssel für Schedule-Overrides. Halte ihn deshalb stabil und innerhalb des Plugins eindeutig. |
| `Schedule` | Der Standard-Schedule des Tasks. Der Betreiber des Hosts kann die Kadenz überschreiben. |
| `ExecuteAsync(IServiceProvider, CancellationToken)` | Eine Ausführung der Arbeit. Löse Scoped Services aus `serviceProvider` auf. |

### `PluginSchedule`

Der Standard-Schedule des Plugins für einen Hintergrund-Task, als Scheduler-unabhängiger Wert ohne
Abhängigkeit über die BCL hinaus. Der Host bildet ihn auf seinen eigenen Scheduler ab, und der Betreiber des
Hosts kann die Kadenz pro Deployment überschreiben. Behandle diese Werte als Standard, nicht als Garantie.

```csharp
public sealed record PluginSchedule(string Cron, int Retries = 0, IReadOnlyList<TimeSpan>? RetryIntervals = null, bool RunOnStartup = false)
```

| Member | Zweck |
|---|---|
| `Cron` | Normaler 5-Felder-Cron-Ausdruck (`minute hour day-of-month month day-of-week`). Wird im Konstruktor und bei jedem `with`-Ausdruck validiert. Ein ungültiger Ausdruck wirft `ArgumentException`. |
| `Retries` | Wie oft der Host eine fehlgeschlagene Ausführung wiederholt. Muss `>= 0` sein, sonst wird `ArgumentOutOfRangeException` geworfen. |
| `RetryIntervals` | Wartezeit vor jeder Wiederholung. Gibt es mehr Wiederholungen als Intervalle, nutzt der Host das letzte Intervall für die restlichen Versuche. `null` bedeutet, dass der Standard des Hosts gilt. Ein negatives Intervall wirft `ArgumentOutOfRangeException`. |
| `RunOnStartup` | Ob der Host den Task beim Start zusätzlich einmal sofort ausführt. |

| Factory | Erzeugt |
|---|---|
| `Every(TimeSpan interval)` | Einen Schedule mit festem Intervall. Akzeptiert nur ganze Minuten, die 60 teilen (1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60), oder ganze Stunden, die 24 teilen (1, 2, 3, 4, 6, 8, 12, 24). Alles andere lässt sich nicht als echter Cron mit fester Kadenz ausdrücken und wirft `ArgumentOutOfRangeException`. |
| `Daily(int hour, int minute = 0)` | Einen Schedule, der einmal am Tag um `hour:minute` auslöst. Ein Wert ausserhalb des Bereichs wirft `ArgumentOutOfRangeException`. |
| `Hourly(int minute = 0)` | Einen Schedule, der einmal pro Stunde bei `minute` auslöst. Ein Wert ausserhalb des Bereichs wirft `ArgumentOutOfRangeException`. |

```csharp
public sealed class SyncTimetableTask : IPluginBackgroundTask
{
    public string Name => "schulware.sync-timetable";
    public PluginSchedule Schedule => PluginSchedule.Every(TimeSpan.FromMinutes(30));

    public Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken) => Task.CompletedTask;
}
```

Für einen Schedule, den die Factories nicht ausdrücken können, erstelle `PluginSchedule` direkt mit einem
Cron-String und optional mit Wiederholungsverhalten:

```csharp
public PluginSchedule Schedule => new("0 6 * * MON-FRI", Retries: 3, RetryIntervals: [TimeSpan.FromMinutes(1), TimeSpan.FromMinutes(5)]);
```

## `IPluginEventHandler<TCommand>`

Reagiere auf einen Backend-Command oder ein Event. `TCommand` ist kontravariant (`in TCommand`). Registriere
den Handler in `ConfigureServices`. Wirft ein Handler eine Exception, loggt der Host den Fehler und macht mit
den anderen Handlern weiter.

```csharp
public interface IPluginEventHandler<in TCommand>
{
    Task HandleAsync(TCommand command, CancellationToken cancellationToken = default);
}
```

| Member | Zweck |
|---|---|
| `HandleAsync(TCommand, CancellationToken)` | Verarbeitet einen zugestellten Command. |

### `PluginUserPurgeEvent`

Der Host stellt dieses Event zu, wenn ein Schuly-User gelöscht wird. Verarbeite es mit
`IPluginEventHandler<PluginUserPurgeEvent>`, um die eigenen Daten des Plugins zu diesem User zu löschen: seine
Datenbankzeilen und die Vault-Secrets mit dem User als Schlüssel. Der Host löscht Core-Daten selbst, den
Speicher eines Plugins erreicht er aber nur über das Plugin.

```csharp
public sealed record PluginUserPurgeEvent(Guid ApplicationUserId);
```

## `IPluginUserContext`

Liest den aktuellen User und School-User aus einem Plugin heraus.

```csharp
public interface IPluginUserContext
{
    Task<Guid> GetCurrentUserIdAsync(CancellationToken cancellationToken = default);
    Task<Guid?> GetCurrentSchoolUserIdAsync(CancellationToken cancellationToken = default);
}
```

| Member | Zweck |
|---|---|
| `GetCurrentUserIdAsync(CancellationToken)` | Die ID des aktuellen Application-Users. |
| `GetCurrentSchoolUserIdAsync(CancellationToken)` | Die aktuelle School-User-ID, oder `null`, wenn keine im Kontext ist. |

## `IPluginLogin`

Der Vertrag eines Plugins zum Verbinden von Konten und die Quelle seines Eintrags im Schulsystem-Katalog.

1. Das Plugin stellt einen `SchoolSystem`-Descriptor bereit. Der Host sammelt ihn von jedem geladenen Plugin
   ein und nimmt ihn über `Key` in den Katalog auf. Der Betreiber liefert also keine Katalog-Konfiguration. Der
   Anzeigename, das Logo, der Aktivierungsstatus und die Sortierung werden einmal gesetzt. Die
   Login-Einstellungen folgen dem Plugin bei jedem Laden.
2. Der Host stellt einen einheitlichen Login-Endpunkt bereit. Er löst das `IPluginLogin` auf, dessen `SystemKey`
   zum angefragten System passt, und ruft `ConnectAsync` mit den Login-Feldwerten auf, die die App gesammelt hat.
3. Das Plugin liest den aktuellen User über `IPluginUserContext`, authentifiziert sich beim Provider, speichert
   das Konto und gibt dessen ID zurück. Im Backend liegt keine Provider-Authentifizierung.

```csharp
public interface IPluginLogin
{
    SchoolSystemDescriptor SchoolSystem { get; }

    string SystemKey => SchoolSystem.Key;

    Task<PluginLoginResult> ConnectAsync(IReadOnlyDictionary<string, string> fields, string? displayName, CancellationToken cancellationToken = default);
}
```

| Member | Zweck |
|---|---|
| `SchoolSystem` | Der Katalogeintrag, den dieser Login bedient und den die App anzeigt. Siehe `SchoolSystemDescriptor`. |
| `SystemKey` | Der Systemschlüssel im Katalog, den dieser Login verarbeitet, zum Beispiel `"schulnetz"`. Ein Standard-Member, das `SchoolSystem.Key` zurückgibt. Du implementierst also nur `SchoolSystem`. |
| `ConnectAsync(IReadOnlyDictionary<string,string>, string?, CancellationToken)` | Verbindet ein Konto aus den gesammelten Login-Feldern, nach den `LoginFields`-Schlüsseln des Descriptors (zum Beispiel `"email"`, `"password"`, `"baseUrl"`). `displayName` ist ein optionaler Anzeigename. |

### `SchoolSystemDescriptor`

Baue dieses Record in deinem `IPluginLogin`.

| Member | Zweck |
|---|---|
| `Key` | Erforderlich. Der Systemschlüssel, zum Beispiel `"schulnetz"`. |
| `DisplayName` | Erforderlich. Der Name, den die App anzeigt. |
| `LoginMethod` | `"credentials"` (Standard) oder `"oauth-webview"`. |
| `LogoUrl` | Optionales Logo. |
| `PrivateAuthStrategy` | `"token"` (ein Headless-Login erzeugt ein Bearer-Token) oder `"scrape"` (Zugangsdaten werden bei jedem Abruf erneut gesendet). |
| `StatelessBasePath` | Endpunkte für den privaten Modus, zum Beispiel `"/api/plugins/schulware/stateless"`. |
| `PluginBasePath` | Endpunkte für den Account-Modus, zum Beispiel `"/api/plugins/schulware"`. |
| `LoginMethodPath` | Anonymer Endpunkt, den die App aufruft (GET, `?baseUrl=`), sobald die URL der Schule eingegeben ist. Er antwortet mit einem `LoginMethodResult`. |
| `Enabled` | Ob das System aktiviert ist. Standardwert ist `true`. |
| `SortOrder` | Position im Katalog. |
| `LoginFields` | Die `SchoolSystemLoginFieldDescriptor`-Eingaben, die die App anzeigt, um zu sammeln, was `ConnectAsync` braucht. |

Die Konstante `SchoolSystemDescriptor.LinkedAccountFieldKey` (`"linkedAccountId"`) ist das Login-Feld, das die
ID des gewählten verknüpften Kontos trägt.

### `SchoolSystemLoginFieldDescriptor`

| Member | Zweck |
|---|---|
| `Key` | Erforderlich. Wird mit dem gesammelten Wert übermittelt, zum Beispiel `"baseUrl"`. |
| `Label` | Erforderlich. Die Feldbeschriftung. |
| `Type` | `"url"`, `"text"` (Standard) oder `"password"`. |
| `Placeholder` | Optionaler Platzhalter. |
| `DefaultValue` | Optionaler Standardwert. |
| `Required` | Standardwert ist `true`. |
| `ReplacedByLinkedAccount` | Ausgeblendet, wenn sich die Schule mit einem verknüpften Konto anmeldet, zum Beispiel bei Feldern für E-Mail, Passwort und 2FA. |
| `Suggestions` | Bekannte Werte, die die App zur Auswahl anbietet, zum Beispiel Schulen und ihre URLs, als `LoginFieldSuggestion`. Der User kann trotzdem jeden anderen Wert eingeben. |

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

### Login-Methode und Browser-Anmeldung

```csharp
public sealed record LoginFieldSuggestion(string Label, string Value);
public sealed record LoginMethodResult(string? LinkedProvider) { public string? BrowserLoginPath { get; init; } }
public sealed record BrowserLoginStart(string AuthUrl, string CallbackUrl, string State, string Context, string? CompletePath) { public const string CallbackFieldKey = "browserCallbackUrl"; public const string ContextFieldKey = "browserContext"; }
```

`LoginMethodPath` antwortet mit einem `LoginMethodResult`. Ein leerer `LinkedProvider` ohne `BrowserLoginPath`
bedeutet normale Zugangsdaten.

- **Verknüpftes Konto.** Setze `LinkedProvider`, wenn sich die Schule mit einem verknüpften Konto anmeldet. Die
  App zeigt die verknüpften Konten dieses Providers und übermittelt `linkedAccountId` anstelle der Felder, die
  mit `ReplacedByLinkedAccount` markiert sind.
- **Browser-Anmeldung.** Setze `BrowserLoginPath`, wenn sich die Schule über einen Browser anmeldet, zum Beispiel
  bei einem kantonalen Login, den kein Server ausfüllen kann. Die App blendet die mit `ReplacedByLinkedAccount`
  markierten Felder aus und sendet per POST `{ "baseUrl": ... }` an `BrowserLoginPath`. Das gibt einen
  `BrowserLoginStart` zurück. Die App öffnet `AuthUrl`, wartet auf eine URL, die mit `CallbackUrl` beginnt und
  deren `state` zu `State` passt, und übermittelt diese URL und `Context` als Felder `browserCallbackUrl` und
  `browserContext`: im Account-Modus an `ConnectAsync`, im privaten Modus an `CompletePath`.

### `PluginLoginResult`

Das Ergebnis von `ConnectAsync`.

```csharp
public record PluginLoginResult(bool Success, Guid? AccountId = null, string? Message = null);
```

| Member | Zweck |
|---|---|
| `Success` | Ob das Verbinden erfolgreich war. |
| `AccountId` | Die ID des gespeicherten Kontos bei Erfolg. |
| `Message` | Optionales, für Menschen lesbares Detail, zum Beispiel ein Fehlergrund. |

## `ISchoolData`

Der Schreibzugriff des Plugins auf die Schuldaten von Schuly. Der Host stempelt jede Zeile mit dem aufrufenden
Plugin als Quelle und lässt ein Plugin nur auf Lernende schreiben, die es selbst angelegt hat. Das Schreiben auf
Lernende eines anderen Plugins wirft `UnauthorizedAccessException`.

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

| Member | Zweck |
|---|---|
| `EnsureSchoolAsync` | Sucht eine Schule über die Website (oder über den Namen, wenn sie keine hat) und erstellt sie, falls sie fehlt. Gibt ihre ID zurück. |
| `EnsureStudentAsync` | Sucht das Lernendenprofil des Users an der Schule, erstellt es, falls es fehlt, und füllt leere Felder. Gibt die School-User-ID zurück. |
| `SyncAgendaAsync`, `SyncGradesAsync`, `SyncAbsencesAsync`, `SyncDocumentsAsync` | Fügt Records über `ExternalId` ein oder aktualisiert sie: unbekannte IDs werden hinzugefügt, bekannte aktualisiert. Gibt `SyncResult(Added, Updated)` zurück. |
| `SyncExamsAsync` | Fügt Prüfungen über Fach und Name ein oder aktualisiert sie. `ExamRecord` hat keine `ExternalId`. Gibt `SyncResult(Added, Updated)` zurück. |
| `SyncSemesterReportsAsync` | Fügt Semesterberichte über Programmcode, Schuljahr und Halbjahr ein oder aktualisiert sie. Die Fächer jedes Berichts werden als Ganzes ersetzt. Gibt `SyncResult(Added, Updated)` zurück. |
| `GetDocumentIdsAsync` | Externe IDs der Dokumente, die dieses Plugin für die lernende Person schon synchronisiert hat. So kann es das erneute Herunterladen überspringen. |

`SyncGradesAsync` erstellt bei Bedarf das Fach (die Klasse) und die Prüfung für jede Note und schreibt die
lernende Person ein. `SyncExamsAsync` macht dasselbe für Prüfungen ohne Note, zum Beispiel anstehende Tests. Weil
eine Prüfung über Fach und Name zugeordnet wird, landet eine spätere Note auf derselben Prüfung. Hosts älter als
0.8 ignorieren `SyncExamsAsync`: Die Standardimplementierung tut nichts.

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

- **Zeiten sind `DateTimeOffset`.** Wandle Ortszeiten des Providers mit dessen Zeitzone um, bevor du ein Record
  baust. Schuly speichert nur UTC. Ein Eintrag nur mit Datum, zum Beispiel ein Feiertag oder eine ganztägige
  Absenz, beginnt um Mitternacht UTC seines Tages.
- **`ExternalId` muss stabil sein** über Syncs hinweg für dasselbe Element. Nutze die eigene ID des Providers,
  falls es eine gibt, sonst einen Schlüssel aus Feldern, die sich nicht ändern. Der Host lehnt eine ID mit mehr als
  300 Zeichen mit `ArgumentException` ab.
- **`GradeRecord`:** `Subject` wird zur Klasse und `ExamName` zur Prüfung darin. `ClassAverage` ist der
  Klassendurchschnitt, den die Schule meldet, wenn sie einen veröffentlicht.
- **`ExamRecord`** passt zu der Prüfung, die ein `GradeRecord` mit demselben `Subject` und `Name` erstellt.
- **`AbsenceRecord.IsExcused`** gibt an, ob die Schule eine Entschuldigung akzeptiert hat. Der Wert ist `null`,
  wenn die Schule dazu nichts angibt.
- **`SemesterReportRecord`:** `SchoolYearStart` ist das Jahr, in dem das Schuljahr beginnt (2025 für 25/26), und
  `SemesterHalf` ist 1 oder 2.
- **`SemesterSubjectRecord`** hat eine numerische `Grade` oder, wenn es keine gibt, einen `Marker` wie `"disp"`.
- **`DocumentRecord.File`** ist das, was `IPluginFileStore.SaveAsync` zurückgegeben hat, falls du die Datei
  heruntergeladen hast.

## `IPluginVault`

Der eigene verschlüsselte Secret-Speicher des Plugins für Tokens und Zugangsdaten. Jedes Plugin erhält einen
eigenen Namespace. Die Werte sind im Ruhezustand verschlüsselt (AES-256-GCM) und nur über diesen Vault lesbar.

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

Speichert eine heruntergeladene Datei, zum Beispiel ein Zeugnis, im verschlüsselten Dokumenten-Storage von Schuly.
Übergib das zurückgegebene `StoredFile` in einem `DocumentRecord`, damit die App es herunterladen kann.

```csharp
public interface IPluginFileStore
{
    Task<StoredFile> SaveAsync(Stream content, string fileName, string? contentType, CancellationToken cancellationToken = default);
}

public sealed record StoredFile(string Key, long SizeBytes);
```

## `ILinkedAccounts`

Konten, die ein User bei einem externen Identity Provider wie Microsoft verknüpft hat, von jedem Plugin gemeinsam
genutzt: Ein Plugin verknüpft das Konto, ein anderes meldet sich damit an. Jeder Aufruf ist auf den angegebenen
User beschränkt. Secrets sind im Ruhezustand verschlüsselt.

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

| Member | Zweck |
|---|---|
| `SaveAsync` | Fügt das Konto hinzu oder aktualisiert es, wenn der User diese `ExternalId` beim Provider schon verknüpft hat. |
| `RemoveAsync` | Entfernt das Konto und seine Secrets. |
| `LinkedProviders.Microsoft` | Der Provider-Schlüssel `"microsoft"`. |
| `LinkedSecrets.RefreshToken` | Der Secret-Name `"refresh_token"`: das OAuth-Refresh-Token des Providers. |
| `LinkedSecrets.SessionCookies` | Der Secret-Name `"session_cookies"`: die Anmelde-Session des Providers als JSON-Array von `{domain, name, path, value}`-Cookies. |

## `ILinkProvider`

Vom Host gerendertes Verknüpfen von Konten (Namespace `Schuly.Plugin.Abstractions.Linking`, seit 0.11). Ein Plugin
deklariert einen Descriptor und steuert einen mehrstufigen Ablauf. Der Host und die Clients rendern die Schritte,
die es zurückgibt. Kein Client codiert also Plugin-spezifische Bildschirme fest. Registriere ihn mit
`services.AddScoped<ILinkProvider, XLinkProvider>()`.

Der Host liest jeden Descriptor beim Laden einmal. Einen ungültigen oder doppelten Descriptor loggt er und
überspringt ihn.

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
| `LinkProviderDescriptor` | `Id` (`^[a-z0-9][a-z0-9-]{1,40}$`), `DisplayName`, `Description`, `Icon`, `Capabilities`, `Flows`, `SortOrder`. |
| `LinkIcon` | `Lucide` (Icon-Name in Kebab-Case, zum Beispiel `"graduation-cap"`) oder `Svg` (Inline-Markup). Der Host bereinigt das SVG und liefert es von seiner eigenen URL mit einer strikten CSP aus. |
| `ProviderCapability` | Eine Funktion, die die verknüpften Konten des Providers freischalten. Clients liefern generische UIs pro Art aus und rufen das Plugin unter `BasePath` auf. Bekannte Arten: `mail`, `chat`, `drive`, `notes`, `calendar`, `absence_reporting`, `school_data`. |
| `LinkFlowDescriptor` | `Id` (gleiches Muster wie die Provider-ID), `Label`, `Description`, `Platforms` (`LinkPlatforms`, Standardwert `All`). |
| `LinkStepResult(Step, State)` | Der nächste Schritt plus undurchsichtiger Plugin-Zustand. `Done(accountId, title, state)` und `Fail(message)` bauen die Endschritte. Ihre Schritt-IDs sind `DoneStepId` (`"done"`) und `ErrorStepId` (`"error"`). |
| `LinkStep` | `Id`, die der Client beim Absenden zurücksendet. `Kind` (`Form`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Select`, `Done`, `Error`). `Title`, `Description`, Inline-`Error` und `SubmitLabel`. Die Nutzdaten für die Art: `Fields`, `Otp`, `PushCode`, `DeviceCode`, `Redirect`, `Options`, `Done`. `Actions` sind alternative Buttons, die als Aktions-ID übermittelt werden. |
| `LinkField` | Formularfeld: `Key` (`^[A-Za-z][A-Za-z0-9_]{0,40}$`), `Label`, `Type`, `Placeholder`, `Help`, `DefaultValue`, `Required`, `Secret`, `MaxLength`, `Pattern` (.NET-Regex), `Options`, `AllowCustom`. |
| `LinkOption` | `LinkProviderId` bedeutet, wenn gesetzt, «zuerst ein Konto bei diesem Provider verknüpfen». Der Client führt den Verknüpfungsablauf dieses Providers aus und sendet diesen Schritt dann mit der Aktion `refresh` erneut. |
| `LinkRedirect` | `HostCallback`: Der Browser kehrt zu `LinkStartContext.HostCallbackUrl` zurück. `Capture`: Eine mobile WebView fängt die erste URL ab, die mit `CallbackPrefix` beginnt, und übermittelt dann `callbackUrl` und `cookies` für `CaptureCookieDomains`. |
| `LinkedAccountSummary` | Zeile, die `ListAccountsAsync` zurückgibt: `Status` (`Ok`, `Syncing`, `Expired`, `Error`; Clients pollen während `Syncing`) und optional `LastSyncedAt`. |

Die positionalen Records und Enums:

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

### Sicherheitsregeln

- Der Host verwahrt `State` (verschlüsselt, im Arbeitsspeicher, höchstens 10 Minuten) und sendet es nie an Clients.
  Es darf nie Passwörter oder andere vom User eingegebene Secrets enthalten.
- Weder Host noch Plugin loggen oder speichern Felder mit `Secret = true` oder irgendeinen übermittelten Wert.
  Schreibe keine übermittelten Werte in Fehlermeldungen.
- Vom User eingegebene Secrets (Passwörter, TOTP-Secrets, OTP-Codes, Refresh-Tokens) dürfen nie geloggt, im
  Klartext gespeichert oder in `State` abgelegt werden. Erfasste Cookies sind ebenfalls Secrets. Logge sie also nie.
- `Capture`-Redirects gibt es nur auf Mobilgeräten. Der Host lehnt sie für die Web-Plattform ab. Nutze
  `HostCallback` nur, wenn der Provider den Browser wirklich zum Host zurückschickt.
- Verifizierungs- und Redirect-URLs müssen https sein.

### Validatoren

Der Host nutzt diese reinen Helfer, die keine Abhängigkeiten haben:

- `LinkStepValidator.Validate(LinkStep step, IReadOnlyDictionary<string, string> values, string? action)`
  prüft eine Übermittlung gegen den aktuellen Schritt.
  - Er lehnt unbekannte Schlüssel ab.
  - Er erzwingt Pflichtfelder, `MaxLength` (Standard 2048), `Pattern` (Timeout 100 ms), die Form von E-Mail-Adressen,
    https-URLs (http nur für localhost) und Select-Optionen (ausser bei `AllowCustom`).
  - Ein Otp-Schritt nimmt den Schlüssel `code` (genau `Length` Zeichen, Ziffern bei `NumericOnly`). Ein Select-Schritt
    nimmt den Schlüssel `value`. Ein Capture-Redirect nimmt `callbackUrl` und optional `cookies`.
  - `action` muss eine der Aktionen des Schritts sein oder das reservierte `refresh` oder `cancel`. Mit einer Aktion
    entfallen die Pflichtprüfungen.
  - Meldungen nennen Feldschlüssel, nie Werte.
- `LinkDescriptorValidator.ValidateDescriptor(LinkProviderDescriptor)` und
  `ValidateStep(LinkStep, LinkPlatform)` prüfen IDs, Schlüssel, reine https-URLs und Capture im Web.
  `IsValidId(string?)` und `IsValidFieldKey(string?)` prüfen eine einzelne ID oder einen einzelnen Schlüssel.

Beide Validatoren geben `LinkValidationResult` zurück:

```csharp
public sealed record LinkValidationResult(bool IsValid, IReadOnlyList<string> Errors);
```

Seine Eigenschaft `Valid` ist das Erfolgsergebnis, und `FromErrors(errors)` baut ein Ergebnis aus einer Fehlerliste.

Unter [Versionierung](versioning.md) findest du die Regeln für Änderungen an diesen Members.
