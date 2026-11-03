# Documentazione di SchulyServer

SchulyServer è l'API e l'app web ASP.NET Core 10 alla base di Schuly. Segue un'architettura pulita
con CQRS (tramite [Mediator](https://github.com/martinothamar/Mediator)), usa EF Core su PostgreSQL,
ha l'accesso integrato e carica i plugin a runtime da un registro.

## Esegui un server

- [Self-hosting di Schuly](setup/self-hosting.md)
- [Eseguire senza dominio](setup/self-hosting-lan.md)
- [Gestire e aggiornare il server](setup/operations.md)
- [Configurazione](setup/configuration.md)
- [Gestione dei plugin](plugin-management.md)

## Lavora sul codice

- [Setup di sviluppo](setup/development.md)
- [Architettura](architecture.md)
- [Migrazioni](migrations.md)
- [Immagini e release](setup/production.md)
- [Come contribuire](contributing.md)
