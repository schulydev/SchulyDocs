# SchulyPlugins

Nutze diese Seiten, um Plugins für den [Schuly-Server](https://github.com/schulydev/SchulyServer) zu bauen, zu
testen und auszuliefern.

| Seite | Nutze sie, um |
|---|---|
| [Plugin hinzufügen](adding-a-plugin.md) | von einer Kopie des Beispiel-Plugins zu einem geladenen Plugin zu kommen |
| [Entwicklungsumgebung](setup/development.md) | die Tools zu installieren, ein Plugin zu bauen und es auf einem lokalen Server auszuführen |
| [EF-Core-Migrationen](migrations.md) | einem Plugin eine eigene Datenbank zu geben und sein Schema weiterzuentwickeln |
| [Kiota-Client](setup/kiota-client.md) | den Schulware-API-Client neu zu generieren |
| [Distribution](setup/distribution.md) | zu sehen, wie Plugins gebaut und auf den `repo`-Branch ausgeliefert werden |
| [Contributing](contributing.md) | den eigenen Regeln dieses Repos zu folgen |

## Wie Plugins funktionieren

Jedes Plugin liegt in einem eigenen Ordner unter `src/`, zielt auf .NET 10 und implementiert `ISchulyPlugin` aus
[`Schuly.Plugin.Abstractions`](https://github.com/schulydev/SchulyPluginAbstractions), einer NuGet-`PackageReference`.

CI baut jedes Plugin und veröffentlicht die DLLs auf dem `repo`-Branch (Distribution im Aniyomi-Stil). Der Server
lädt die Plugins herunter, die in seiner `plugins.yml` aufgelistet sind, und lädt sie beim Start. Er ruft
`ConfigureServices`, `MigrateAsync` und `ConfigureEndpoints` auf und plant dann alle wiederkehrenden
`IPluginBackgroundTask` ein.

## Aufbau des Repositorys

| Pfad | Rolle |
|---|---|
| `src/Schuly.Plugin.Example/` | Referenz-Plugin zum Kopieren. Ein minimales `ISchulyPlugin` mit Minimal-API-Endpunkten, anonymen und autorisierten Routen und einer Demo des Vaults pro Plugin. |
| `src/Schuly.Plugin.Schulware/` | Schulnetz-Integration über [SchulwareAPI](https://github.com/schulydev/SchulwareAPI). EF Core und Postgres, ein von Kiota generierter Client, ein Hintergrund-Sync-Task und MVC-Controller. |
| `src/Schuly.Plugin.OdaOrg/` | Integration von OdaOrg (Lehrlingsportal von ICT-BBAG). Ein Scraper mit HttpClient und AngleSharp, EF Core und Postgres und ein Hintergrund-Sync-Task. |
| `src/Schuly.Plugin.Microsoft/` | Microsoft 365 über den Service [SchulyMicrosoft](https://github.com/schulydev/SchulyMicrosoft). Verknüpft ein Microsoft-Konto und liest und schreibt Daten von Mail, Kalender, OneDrive, Teams und OneNote. Es hat keine eigene Datenbank. |
| `src/Shared/` | Helfer, die in Plugins einkompiliert werden, die sich dafür entscheiden: `ExternalIds`, `SwissTime`, `DataUri` und `Provisioning/InstanceUrl`. |
| `tests/` | `Schuly.Plugin.Microsoft.Tests` und `Schuly.Plugins.Linking.Tests`. |
| `.github/workflows/build_push.yml` | Findet jedes Plugin-Projekt, baut es und veröffentlicht DLLs und den Index auf dem `repo`-Branch. |
| `.github/workflows/sync-version-on-release.yml` | Versionsabgleich beim Release. |
| `.github/workflows/sync-docs.yml` | Kopiert `docs/` auf die Dokumentations-Site. |

## In einem Plugin-Ordner

Die Plugins Schulware und OdaOrg nutzen diese Ordner. Das Microsoft-Plugin nutzt `Controllers/`, `Services/` und
`Infrastructure/`.

| Ordner | Inhalt |
|---|---|
| `Controllers/` | ASP.NET-MVC-Controller mit den HTTP-Routen. Der Host registriert die Assembly als MVC-ApplicationPart und findet sie deshalb automatisch. |
| `Services/` | Der Hintergrund-Task (`IPluginBackgroundTask`) und kleine Scoped Services für Sync und Login. |
| `Dtos/` (Schulware), `Models/` (OdaOrg) | Records. In `Dtos/` ein Record pro Datei. |
| `Data/` | EF-Core-Entitäten, `DbContext`, Design-Time-Factory und `Migrations/`. |
| `Infrastructure/` | Factories für externe Clients und Helfer. |
| `Client/` | Von Kiota generierter API-Client (nur Schulware). |
| `config.yml` | Beispiel für die Laufzeitkonfiguration. Stelle sie als `Schuly.Plugin.<Name>.yml` im Plugin-Konfigurationsordner des Servers bereit. |
