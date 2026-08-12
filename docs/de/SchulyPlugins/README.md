# SchulyPlugins-Dokumentation

Offizielle Plugins für das [Schuly-Backend](https://github.com/schulydev/SchulyBackend). Jedes
Plugin liegt in einem eigenen Ordner unter `src/`, zielt auf **.NET 10** und implementiert
`ISchulyPlugin` aus [`Schuly.Plugin.Abstractions`](https://github.com/schulydev/SchulyPluginAbstractions)
(eingebunden als NuGet-`PackageReference`). Das Backend lädt beim Start die gebauten Plugin-DLLs
und steuert deren Lebenszyklus (`ConfigureServices`, `ConfigureEndpoints`, `MigrateAsync`) sowie
alle wiederkehrenden `IPluginBackgroundTask`. Plugins werden als DLLs gebaut und in den
`repo`-Branch ausgeliefert (Distribution im Aniyomi-Stil) und von den Betreibern in den
`/app/plugins/`-Ordner des Backends gelegt.

## Aufbau des Repositorys

| Pfad | Rolle |
|---|---|
| `src/Schuly.Plugin.Example/` | Referenz-/Gerüst-Plugin. Minimales `ISchulyPlugin` mit Minimal-API-Endpunkten, anonymen und autorisierten Routen sowie einer Demo für ein Plugin-eigenes Vault. |
| `src/Schuly.Plugin.Schulware/` | Schulnetz-Integration über [SchulwareAPI](https://github.com/schulydev/SchulwareAPI). EF Core + Postgres, Kiota-generierter Client, Hintergrund-Sync-Task, MVC-Controller. |
| `src/Schuly.Plugin.OdaOrg/` | Integration mit OdaOrg (Lehrstellenportal des ICT-BBAG). HttpClient + AngleSharp-Scraper, EF Core + Postgres, Hintergrund-Sync-Task. |
| `.github/workflows/build_push.yml` | Findet jedes `src/Schuly.Plugin.*/*.csproj`, baut es und veröffentlicht DLLs + Index im `repo`-Branch. |
| `.github/workflows/sync-version-on-release.yml` | Versionsabgleich bei einem Release. |

Ein Schulware-/OdaOrg-Plugin-Ordner ist wie folgt aufgebaut:

| Ordner | Inhalt |
|---|---|
| `Controllers/` | ASP.NET-MVC-Controller - HTTP-Routen (der Host registriert die Assembly als MVC-ApplicationPart, sie werden also automatisch erkannt). |
| `Services/` | Hintergrund-Task (`IPluginBackgroundTask`) sowie fokussierte, gescopte Sync-/Login-Services. |
| `Dtos/` / `Models/` | Ein Record pro Datei. |
| `Data/` | EF-Core-Entities, `DbContext`, Design-Time-Factory und `Migrations/`. |
| `Infrastructure/` | Factories/Hilfsklassen für externe Clients. |
| `Client/` | Kiota-generierter API-Client (nur Schulware). |
| `config.yml` | Beispiel-Laufzeitkonfiguration (`Schuly.Plugin.<Name>.yml` im Plugins-Config-Verzeichnis des Backends). |

## Dokumente

| Dokument | Inhalt |
|---|---|
| [setup/development.md](setup/development.md) | Voraussetzungen, Bauen eines Plugins, Betrieb gegen ein laufendes Backend. |
| [adding-a-plugin.md](adding-a-plugin.md) | Gerüst für ein neues Plugin + der `ISchulyPlugin`-Lebenszyklus. |
| [migrations.md](migrations.md) | EF-Core-Migrationen pro Plugin und die dedizierte Postgres-Datenbank. |
| [setup/kiota-client.md](setup/kiota-client.md) | Den Schulware-Kiota-Client neu generieren. |
| [setup/distribution.md](setup/distribution.md) | Wie Plugins gebaut und in den `repo`-Branch ausgeliefert werden. |
| [contributing.md](contributing.md) | Der verbindliche Ablauf Issue → Branch → PR → Squash. |
