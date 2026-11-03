# Architektur

Auf dieser Seite findest du, wo Code in SchulyServer hingehört und wie du etwas ergänzt. Der Server ist eine
Clean-Architecture-Solution mit CQRS. Schlanke Controller senden Commands und Queries über
[Mediator](https://github.com/martinothamar/Mediator) an Handler in der Application-Schicht. Persistenz und externe
Integrationen liegen in der Infrastructure-Schicht.

## Projekte

Die Solution-Datei ist `Schuly.API.slnx`.

| Projekt | Rolle |
|---|---|
| `Schuly.API` | Einstiegspunkt. Controller, Anmelde-Verdrahtung und `/auth`-Endpunkte, OpenAPI und Scalar, Migrationen beim Start, Plugin-Host, MCP-Server, Helply. Besitzt das `Dockerfile` der API. |
| `Schuly.Application` | CQRS-Commands und -Queries, Mediator-Handler, DTOs, Mapper, Autorisierungs- und Pipeline-Behaviors. Darf Infrastructure nicht referenzieren. |
| `Schuly.Domain` | Reine Entitäten (`School`, `Class`, `Exam`, `Grade`, `Absence`, `AgendaEntry`, `ApplicationUser`, `SchoolUser`, `Teacher`, `SchoolSystem`, `SemesterReport`, `StudentDocument` und weitere). Jede erbt von `Base` (`Id`, `CreatedAt`, `UpdatedAt`). |
| `Schuly.Infrastructure` | `SchulyDbContext` (mit den Anmelde-Tabellen), User-Services, Storage, der Secrets-Vault für Plugins, die Vertrags-Services für Plugins (`Plugins/`), Repositories. |
| `Schuly.Sandbox` | Der Sandbox-Sidecar von Helply, mit eigenem Image `ghcr.io/schulydev/schuly-sandbox`. |
| `Schuly.Frontend` | Die Angular-22-Web-App, gebaut mit Bun. Sie gehört nicht zur Solution-Datei. Das API-Image liefert sie aus `wwwroot` aus. |
| `Schuly.Tests`, `Schuly.Tests.Plugin` | Testprojekte (TUnit). |

`Schuly.Plugin.Abstractions` ist eine NuGet-`PackageReference`, keine Projektreferenz. Die Abstractions und die Plugins
liegen in separaten Repositories.

## Schichtregeln

- Abhängigkeiten zeigen nach innen: `API → Application → Domain` und `Infrastructure → Application/Domain`.
- `Schuly.Application` darf `Schuly.Infrastructure` nicht referenzieren. Handler hängen von Abstraktionen ab, und das
  API-Projekt registriert die konkreten Services in `Program.cs`.
- `Schuly.Domain` hat keine Projektabhängigkeiten.

## Request-Pipeline

`Program.cs` registriert drei Pipeline-Behaviors, die in dieser Reihenfolge laufen:

1. `AuthorizationBehavior`: wirft eine Exception, wenn ein Request-Typ kein Attribut `[AllowAuthenticated]` hat.
2. `NotificationOriginBehavior`: markiert die Anfrage als vom User ausgelöst, damit die eigenen Aktionen des Users nie
   eine Push-Benachrichtigung erzeugen.
3. `PluginEventBehavior`: sendet Backend-Commands an die Event-Handler der Plugins.

Die Source-Generierung von Mediator registriert die Handler. Es genügt also, die Klassen hinzuzufügen.

## Entität und Endpunkt hinzufügen

1. **Entität:** Füge sie zu `Schuly.Domain` hinzu. Sie erbt von `Base`.
2. **DbSet und Konfiguration:** Füge sie zu `Schuly.Infrastructure/SchulyDbContext.cs` hinzu.
3. **Migration:** Siehe [Migrationen](migrations.md).
4. **Command oder Query:** Füge ihn zu `Schuly.Application/Commands/<Entity>/` oder `Queries/<Entity>/` hinzu.
5. **Handler:** Füge ihn neben dem Command oder der Query hinzu.
6. **Controller:** Füge einen schlanken zu `Schuly.API/Controllers/` hinzu, der an Mediator delegiert.

## Dokumenten-Storage

Dokumente von Lernenden und Avatare liegen in einem S3-kompatiblen Bucket. Die mitgelieferten Dev- und
Self-Hosting-Stacks nutzen SeaweedFS, und jede S3-Implementierung funktioniert ohne Code-Änderung. Die Einstellungen
findest du unter [Konfiguration](setup/configuration.md#document-storage-s3).

Das Backend leitet jedes Byte weiter. Clients erhalten nie S3-URLs und verbinden sich nie direkt mit dem Storage:

- Hochladen mit `POST /api/students/{id}/documents` (multipart).
- Herunterladen von `GET /api/documents/{id}`, das eine Datei-Antwort liefert.

Avatare sind die einzige Ausnahme. Du lädst sie mit `PUT /api/me/avatar` hoch, und die Datenbank enthält nur einen
reinen Blob-Schlüssel. Der Server erstellt für jeden Zugriff eine kurzlebige, HMAC-signierte URL unter
`/api/avatars/users/{id}`. Siehe [Avatar-URL-Signierung](setup/configuration.md#avatar-url-signing).

## MCP-Server und Helply

`/mcp` ist ein zustandsloser Streamable-HTTP-Server. Seine Tools liegen in `Schuly.API/Mcp/Tools`, seine Authentifizierung
in `Schuly.Infrastructure/Mcp`. MCP-Tokens und `/api`-JWTs funktionieren nicht auf den Endpunkten des jeweils anderen.

Jedes Tool braucht `[McpAccess(area, level)]`, und Löschvorgänge brauchen zusätzlich `[McpDestructive]`. Ein neues Tool
ohne `[McpAccess]` ist für jede Verbindung sichtbar.

Helply liegt in `Schuly.API/Helply`. Siehe [Konfiguration](setup/configuration.md#helply) für Helply und
[MCP-Server](setup/configuration.md#mcp-server) für die MCP-Einstellungen.

## Plugin-Host

Das Backend hostet Plugins, die `ISchulyPlugin` aus `Schuly.Plugin.Abstractions` implementieren. Die Laufzeit liegt in
`Schuly.API/Plugins`:

- Sie lädt Plugins zur Laufzeit aus einer Registry nach `/app/plugins` herunter.
- Sie lädt jedes Plugin in einen eigenen, collectible `AssemblyLoadContext`, mit einem untergeordneten DI-Container.
- Plugins können Controller, Minimal-API-Endpunkte und wiederkehrende Hintergrund-Tasks registrieren. Der Scheduler des
  Hosts führt jeden Task über seinen Namen im DI-Scope des zugehörigen Plugins aus.
- `PluginScopeMiddleware` führt Plugin-Anfragen im DI-Scope des zugehörigen Plugins aus.

Registry, Hot-Swap und Hintergrund-Tasks findest du unter [Plugin-Verwaltung](plugin-management.md).

### Was ein Plugin erreichen kann

Plugins erhalten nie `SchulyDbContext` oder die Entitäten des Backends. Der Host registriert diese Vertrags-Services im
Container jedes Plugins:

| Service | Basiert auf |
|---|---|
| `ISchoolData` | `PluginSchoolData` über `SchulyDbContext`, gestempelt mit dem Assembly-Namen des Plugins als `Source` |
| `IPluginVault` | Dem persistenten Vault, Namespace `plugin:<Name>` |
| `IPluginFileStore` | `IDocumentStorage` (verschlüsseltes S3) |
| `IPluginUserContext` | Dem User der aktuellen Anfrage |

Synchronisierte Zeilen (`AgendaEntry`, `Absence`, `Grade`, `StudentDocument`) tragen `Source` und `ExternalId`, eindeutig
pro lernende Person. Ein leeres `Source` bedeutet, dass jemand die Zeile von Hand erfasst hat, und kein Plugin berührt sie.

Ein Plugin darf nur auf Lernende schreiben, deren `SchoolUser.Source` sein eigenes ist. Das erste Plugin, das eine lernende
Person ohne Quelle anlegt oder synchronisiert, übernimmt sie.

### Von Hand erfasste Daten

Schuly funktioniert ohne Plugin. Unter `api/me` kann ein angemeldeter User:

- Mit `POST api/me/schools` eine eigene Schule erstellen. Der User wird dadurch als lernende Person dieser Schule geführt.
- Mit `api/me/grades` eigene Noten hinzufügen, ändern und entfernen. Fach und Prüfung werden bei Bedarf erstellt.

Absenzen und Agenda-Einträge nutzen die regulären Endpunkte. Von Hand erfasste Zeilen haben ein leeres `Source`, deshalb
berührt sie kein Sync. Die API lehnt das manuelle Ändern oder Löschen einer synchronisierten Zeile ab und nennt das Plugin.

Zeiten bei manuellen Schreibvorgängen müssen einen UTC-Offset tragen (`...Z` oder `+02:00`). Die API lehnt Zeiten ohne
Offset ab.

### Vertragskompatibilität

Bevor `PluginContract` ein Plugin erstellt, prüft es, gegen welche Version von `Schuly.Plugin.Abstractions` das Plugin
gebaut wurde:

- **Vor 1.0:** Die MAJOR.MINOR muss übereinstimmen.
- **Ab 1.0:** Die MAJOR muss übereinstimmen, und die MINOR des Plugins darf nicht neuer sein als die des Hosts.

`PluginContract` lehnt auch ein Plugin ab, das `Schuly.Domain`, `Schuly.Infrastructure`, `Schuly.Application` oder
`Schuly.API` referenziert. Die Fehlermeldungen nennen beide Versionen.
