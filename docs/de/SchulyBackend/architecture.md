# Architektur

SchulyBackend ist eine Clean-Architecture-Lösung mit CQRS. Anfragen laufen über
schlanke Controller, die Commands/Queries via [Mediator](https://github.com/martinothamar/Mediator)
an Handler in der Application-Schicht weiterleiten; Persistenz und externe
Integrationen liegen in der Infrastructure-Schicht.

## Projekte

Die Solution (`Schuly.API.slnx`) ist in folgende Projekte unterteilt:

| Projekt | Rolle |
|---|---|
| `Schuly.API` | Einstiegspunkt. Controller, OIDC-Verdrahtung, OpenAPI/Scalar, Startup-Migrationen, Registrierung des Plugin-Hosts. Enthält das `Dockerfile`. |
| `Schuly.Application` | CQRS-Commands/-Queries plus Mediator-Handler, DTOs, Mapper, Autorisierung und Pipeline-Behaviors. **Darf nicht** auf Infrastructure verweisen. |
| `Schuly.Domain` | Reine Entitäten (`School`, `Class`, `Exam`, `Grade`, `Absence`, `AgendaEntry`, `ApplicationUser`, `SchoolUser`, `Teacher`, `SchoolSystem`, `SemesterReport`, `StudentDocument`, …). Jede erbt von `Base` (`Id`, `CreatedAt`, `UpdatedAt`). |
| `Schuly.Infrastructure` | `SchulyDbContext`, OIDC-/User-Services, Storage und Vault, Repositories, Plugin-Runtime (`PluginBackgroundTaskHost`). |
| `Schuly.Tests` / `Schuly.Tests.Plugin` | Testprojekte (TUnit). |

`Schuly.Plugin.Abstractions` wird als **NuGet-`PackageReference`** eingebunden, nicht
als Projektreferenz. Die Abstractions und die Plugin-Implementierungen leben in
separaten Repositories.

## Schichtenregeln

- Abhängigkeiten zeigen nach innen: `API → Application → Domain`, und
  `Infrastructure → Application/Domain`.
- **`Schuly.Application` darf nicht auf `Schuly.Infrastructure` verweisen.** Handler
  hängen von Abstraktionen ab; das API-Projekt bindet die konkreten
  Infrastructure-Services beim Start in den DI-Container ein (`Program.cs`).
- `Schuly.Domain` hat keine Projektabhängigkeiten - die Entitäten bleiben rein.

## Request-Pipeline

Controller sind schlank und delegieren an Mediator. Zwei Pipeline-Behaviors werden
explizit in `Program.cs` registriert und laufen in Registrierungsreihenfolge:

1. `AuthorizationBehavior` - erzwingt Rollen-Gates, bevor der Handler läuft.
2. `PluginEventBehavior` - leitet Backend-Commands an Plugin-Event-Handler weiter.

Mediator-Handler werden automatisch via Source-Generation registriert, sodass ein
neuer Command/eine neue Query samt Handler allein durch das Hinzufügen der Klassen
verdrahtet ist.

## Dokumenten-Storage

Schülerdokumente und Avatare werden in einem S3-kompatiblen Bucket abgelegt - im
mitgelieferten Dev- und Self-Hosting-Stack ist das SeaweedFS, wobei jede
S3-Implementierung ohne Codeänderung funktioniert. Siehe
[Konfiguration](setup/configuration.md#document-storage-s3) für die Einstellungen.

Das Backend **leitet jedes Byte selbst durch**: Clients erhalten nie S3-URLs und
verbinden sich nie direkt mit dem Storage-Backend. Uploads gehen an
`POST /api/students/{id}/documents` (multipart), Downloads kommen von
`GET /api/documents/{id}` als Dateiresponse zurück. Avatare bilden die eine
Ausnahme - die Datenbank speichert nur einen blossen Blob-Key, und pro Zugriff wird
eine kurzlebige, HMAC-signierte Capability-URL ausgestellt (siehe
[Avatar-URL-Signierung](setup/configuration.md#avatar-url-signing)).

## Eine Entität + einen Endpunkt hinzufügen

1. **Entität** in `Schuly.Domain` (erbt von `Base`).
2. **DbSet + Konfiguration** in `Schuly.Infrastructure/SchulyDbContext.cs`.
3. **Migration** - siehe [Migrationen](migrations.md).
4. **Command/Query** in `Schuly.Application/Commands/<Entity>/` oder
   `Queries/<Entity>/`.
5. **Handler** direkt daneben (automatisch registriert via Mediator-Source-Gen).
6. **Controller** in `Schuly.API/Controllers/` - schlank, delegiert an Mediator.

## Plugin-Host

Das Backend hostet Plugins, die `ISchulyPlugin` aus `Schuly.Plugin.Abstractions`
implementieren. Plugins werden zur Laufzeit aus einer Registry nach `/app/plugins`
heruntergeladen, jedes in seinen eigenen collectible `AssemblyLoadContext` mit einem
Child-DI-Container geladen, und können Controller, Minimal-API-Endpunkte und
wiederkehrende Background-Tasks registrieren (ausgeführt von
`PluginBackgroundTaskHost`). Plugin-Requests laufen im DI-Scope des jeweiligen
Plugins ab, vermittelt über `PluginScopeMiddleware`. Siehe
[Plugin-Verwaltung](plugin-management.md) für Registry, Hot-Swap und
Admin-Endpunkte.
