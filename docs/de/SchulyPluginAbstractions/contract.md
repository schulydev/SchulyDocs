# Vertragsreferenz

Alles im Package lebt im Namespace `Schuly.Plugin.Abstractions` und zielt auf `net10.0`. Der
Vertrag besteht aus **5 Interfaces** plus zwei kleinen Records. Alle Signaturen unten sind
wortgetreu aus dem Quellcode unter `src/Schuly.Plugin.Abstractions/` übernommen.

> Das Package liefert zusätzlich die Backend-DLLs `Schuly.Domain.dll` und
> `Schuly.Infrastructure.dll` zusammen mit der Abstractions-Assembly aus (siehe die csproj),
> damit Plugins die typisierten Entitäten und den DbContext des Backends für direkten
> DB-Zugriff nutzen können. Siehe [Entwicklung](setup/development.md) dazu, wie diese
> referenziert werden.

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
`ExecuteAsync` im konfigurierten `Interval` auf.

```csharp
public interface IPluginBackgroundTask
{
    string Name { get; }
    TimeSpan Interval { get; }
    Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken);
}
```

| Member | Zweck |
|---|---|
| `Name` | Bezeichner des Tasks (für Logging/Diagnose). |
| `Interval` | Wie oft der Host den Task ausführt. |
| `ExecuteAsync(IServiceProvider, CancellationToken)` | Eine Ausführung der Arbeit. Scoped Services aus `serviceProvider` auflösen. |

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
Betreiber keine Katalogkonfiguration mehr selbst liefern muss. Das Backend stellt anschliessend
einen einzigen, einheitlichen Login-Endpunkt bereit, löst das `IPluginLogin` auf, dessen
`SystemKey` mit dem angeforderten System übereinstimmt, und ruft `ConnectAsync` mit den
Login-Feldwerten auf, die die App gemäss diesem Descriptor gesammelt hat. Das Plugin liest den
aktuellen User über `IPluginUserContext`, authentifiziert sich bei seinem Provider, persistiert
den Account und gibt dessen Id zurück. Es lebt keine Provider-Authentifizierung im Backend.

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
| `SchoolSystem` | Der Katalogeintrag, den die App rendert: `Key`, `DisplayName`, `LoginMethod`, `PrivateAuthStrategy` (`"token"`/`"scrape"`), `StatelessBasePath`, `PluginBasePath`, `SortOrder` und die von der App gesammelten `LoginFields`. |
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
        new() { Key = "baseUrl",  Label = "Schulnetz URL", Type = "url",      Required = true },
        new() { Key = "email",    Label = "Email",         Type = "text",     Required = true },
        new() { Key = "password", Label = "Password",      Type = "password", Required = true },
    ],
};
```

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

---

Siehe [Versionierung](versioning.md) für die Regeln, die Änderungen an all diesen Mitgliedern
regeln.
