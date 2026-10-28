# Architektur

SchulyServer ist eine Clean-Architecture-Lösung mit CQRS. Anfragen laufen über
schlanke Controller, die Commands/Queries via [Mediator](https://github.com/martinothamar/Mediator)
an Handler in der Application-Schicht weiterleiten; Persistenz und externe
Integrationen liegen in der Infrastructure-Schicht.

## Projekte

Die Solution (`Schuly.API.slnx`) ist in folgende Projekte unterteilt:

| Projekt | Rolle |
|---|---|
| `Schuly.API` | Einstiegspunkt. Controller, Verdrahtung der Anmeldung und `/auth`-Endpunkte, OpenAPI/Scalar, Startup-Migrationen, Registrierung des Plugin-Hosts. Enthält das `Dockerfile`. |
| `Schuly.Application` | CQRS-Commands/-Queries plus Mediator-Handler, DTOs, Mapper, Autorisierung und Pipeline-Behaviors. **Darf nicht** auf Infrastructure verweisen. |
| `Schuly.Domain` | Reine Entitäten (`School`, `Class`, `Exam`, `Grade`, `Absence`, `AgendaEntry`, `ApplicationUser`, `SchoolUser`, `Teacher`, `SchoolSystem`, `SemesterReport`, `StudentDocument`, …). Jede erbt von `Base` (`Id`, `CreatedAt`, `UpdatedAt`). |
| `Schuly.Infrastructure` | `SchulyDbContext` (inklusive der Tabellen für die Anmeldung), User-Services, Storage und der Secrets-Vault für Plugins, die Services des Plugin-Vertrags (`Plugins/`), Repositories. |
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
[Konfiguration](setup/configuration.md#dokumenten-storage-s3) für die Einstellungen.

Das Backend **leitet jedes Byte selbst durch**: Clients erhalten nie S3-URLs und
verbinden sich nie direkt mit dem Storage-Backend. Uploads gehen an
`POST /api/students/{id}/documents` (multipart), Downloads kommen von
`GET /api/documents/{id}` als Dateiresponse zurück. Avatare bilden die eine
Ausnahme - sie werden mit `PUT /api/me/avatar` hochgeladen, die Datenbank speichert
nur einen blossen Blob-Key, und pro Zugriff wird eine kurzlebige, HMAC-signierte
Capability-URL unter `/api/avatars/users/{id}` ausgestellt (siehe
[Avatar-URL-Signierung](setup/configuration.md#avatar-url-signierung)).

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
implementieren. Die Plugin-Runtime liegt in `Schuly.API/Plugins`: Plugins werden zur
Laufzeit aus einer Registry nach `/app/plugins` heruntergeladen, jedes in seinen
eigenen collectible `AssemblyLoadContext` mit einem Child-DI-Container geladen, und
können Controller, Minimal-API-Endpunkte und wiederkehrende Background-Tasks
registrieren. Die Tasks werden vom eigenen Scheduler des Hosts ausgeführt und per Name zurück in den
DI-Scope des zugehörigen Plugins geleitet. Plugin-Requests laufen im DI-Scope des
jeweiligen Plugins ab, vermittelt über `PluginScopeMiddleware`. Siehe
[Plugin-Verwaltung](plugin-management.md) für Registry, Hot-Swap, Background-Tasks
und Admin-Endpunkte.

### Was ein Plugin erreichen kann

Plugins erhalten nie den `SchulyDbContext` oder die Entitäten des Backends. Der Host
registriert die Services des Vertrags im Container jedes Plugins:

| Service | Umgesetzt durch |
|---|---|
| `ISchoolData` | `PluginSchoolData` über `SchulyDbContext`, mit dem Assembly-Namen des Plugins als `Source` versehen |
| `IPluginVault` | Den persistenten Vault, Namespace `plugin:<Name>` |
| `IPluginFileStore` | `IDocumentStorage` (verschlüsseltes S3) |
| `IPluginUserContext` | Den Benutzer des aktuellen Requests |

Synchronisierte Zeilen (`AgendaEntry`, `Absence`, `Grade`, `StudentDocument`) tragen
`Source` und `ExternalId`, eindeutig pro Schüler. Ist `Source` null, wurde die Zeile
von Hand erfasst, und kein Plugin fasst sie an. Ein Plugin darf nur zu Schülern
schreiben, deren `SchoolUser.Source` sein eigener ist. Ein Schüler ohne Source wird
vom ersten Plugin übernommen, das ihn anlegt oder synchronisiert.

### Von Hand erfasste Daten

Schuly funktioniert ohne Plugin. Unter `api/me` legt ein angemeldeter Benutzer eine
eigene Schule an (`POST api/me/schools`, er wird deren Schüler) und erfasst, ändert
und löscht seine eigenen Noten (`api/me/grades`; Fach und Prüfung werden bei Bedarf
angelegt). Absenzen und Agenda-Einträge nutzen die regulären Endpunkte. Von Hand
erfasste Zeilen haben `Source` null, daher fasst keine Synchronisierung sie an. Eine
manuelle Änderung oder Löschung einer synchronisierten Zeile wird mit dem Namen des
Plugins abgelehnt. Zeitangaben bei manuellen Schreibvorgängen müssen einen
UTC-Offset tragen (`...Z` oder `+02:00`); Zeiten ohne Offset werden abgelehnt.

### Kompatibilität des Vertrags

Bevor ein Plugin instanziiert wird, prüft `PluginContract` die Version von
`Schuly.Plugin.Abstractions`, gegen die das Plugin gebaut wurde. Vor 1.0 muss
MAJOR.MINOR übereinstimmen. Ab 1.0 muss MAJOR übereinstimmen, und die MINOR des
Plugins darf nicht neuer sein als die des Hosts. Ein Plugin, das `Schuly.Domain`,
`Schuly.Infrastructure`, `Schuly.Application` oder `Schuly.API` referenziert, wird
ebenfalls abgelehnt. Die Fehlermeldung nennt bei einer Ablehnung beide Versionen.
