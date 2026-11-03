# SchulyServer-Dokumentation

SchulyServer ist die ASP.NET Core 10 API und Web-App hinter Schuly. Er folgt einer Clean Architecture
mit CQRS (über [Mediator](https://github.com/martinothamar/Mediator)), verwendet EF Core auf
PostgreSQL, hat die Anmeldung eingebaut und lädt Plugins zur Laufzeit aus einer Registry.

## Server betreiben

- [Schuly selbst hosten](setup/self-hosting.md)
- [Ohne Domain betreiben](setup/self-hosting-lan.md)
- [Server betreiben und aktualisieren](setup/operations.md)
- [Konfiguration](setup/configuration.md)
- [Plugin-Verwaltung](plugin-management.md)

## Am Code arbeiten

- [Entwicklungs-Setup](setup/development.md)
- [Architektur](architecture.md)
- [Migrationen](migrations.md)
- [Images und Releases](setup/production.md)
- [Mitwirken](contributing.md)
