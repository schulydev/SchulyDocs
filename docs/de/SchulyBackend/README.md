# SchulyBackend-Dokumentation

SchulyBackend ist die ASP.NET Core 10 API hinter Schuly. Sie folgt einer Clean
Architecture mit CQRS (über [Mediator](https://github.com/martinothamar/Mediator)),
verwendet EF Core auf PostgreSQL, authentifiziert mit OIDC und hostet Plugins, die
zur Laufzeit aus einer Registry geladen werden.

## Übersicht

- [Architektur](architecture.md) - Schichtenmodell, Zuständigkeiten der Projekte,
  der Ablauf zum Hinzufügen einer Entität und der Plugin-Host.
- Setup
  - [Entwicklung](setup/development.md) - die API und Postgres lokal ausführen.
  - [Self-Hosting](setup/self-hosting.md) - Schritt für Schritt: den ganzen Stack auf
    deinem eigenen Server betreiben.
  - [Konfiguration](setup/configuration.md) - Einstellungen, OIDC, Rollen,
    Connection-Strings.
  - [Produktion](setup/production.md) - Docker-Image, Release-Ablauf,
    Startup-Migrationen.
- [Migrationen](migrations.md) - EF Core Migrationsskripte und Verhalten beim Start.
- [Plugin-Verwaltung](plugin-management.md) - Plugin-Registry zur Laufzeit,
  Hot-Swap, Admin-Endpunkte.
- [Mitwirken](contributing.md) - Workflow und Konventionen von Issue über Branch
  bis PR.
