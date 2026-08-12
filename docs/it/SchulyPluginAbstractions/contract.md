# Riferimento del contratto

Tutto ciò che contiene il pacchetto vive nel namespace `Schuly.Plugin.Abstractions` e ha come
target `net10.0`. Il contratto è composto da **5 interfacce** più due piccoli record. Tutte le
firme qui sotto sono copiate testualmente dal codice sorgente in
`src/Schuly.Plugin.Abstractions/`.

> Il pacchetto distribuisce anche le DLL del backend `Schuly.Domain.dll` e
> `Schuly.Infrastructure.dll` insieme all'assembly abstractions (vedi il csproj), così i
> plugin possono usare le entità tipizzate e il DbContext del backend per l'accesso diretto al
> database. Vedi [sviluppo](setup/development.md) per come vengono referenziate.

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

Lavoro ricorrente in background. Il `PluginBackgroundTaskHost` del backend invoca
`ExecuteAsync` in base all'`Interval` configurato.

```csharp
public interface IPluginBackgroundTask
{
    string Name { get; }
    TimeSpan Interval { get; }
    Task ExecuteAsync(IServiceProvider serviceProvider, CancellationToken cancellationToken);
}
```

| Membro | Scopo |
|---|---|
| `Name` | Identificatore del task (per logging/diagnostica). |
| `Interval` | Con quale frequenza l'host esegue il task. |
| `ExecuteAsync(IServiceProvider, CancellationToken)` | Una singola esecuzione del lavoro. Risolvi i servizi scoped da `serviceProvider`. |

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
        new() { Key = "baseUrl",  Label = "Schulnetz URL", Type = "url",      Required = true },
        new() { Key = "email",    Label = "Email",         Type = "text",     Required = true },
        new() { Key = "password", Label = "Password",      Type = "password", Required = true },
    ],
};
```

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

---

Vedi [versionamento](versioning.md) per le regole che governano le modifiche a uno qualsiasi
di questi membri.
