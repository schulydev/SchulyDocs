# Documentazione di SchulyBackend

SchulyBackend è l'API ASP.NET Core 10 alla base di Schuly. Segue un'architettura
pulita con CQRS (tramite [Mediator](https://github.com/martinothamar/Mediator)),
usa EF Core su PostgreSQL, si autentica con OIDC e ospita plugin caricati a runtime
da un registro.

## Indice

- [Architettura](architecture.md) - suddivisione in livelli, responsabilità dei
  progetti, il flusso per aggiungere un'entità e l'host dei plugin.
- Setup
  - [Sviluppo](setup/development.md) - avviare l'API e Postgres in locale.
  - [Self-hosting](setup/self-hosting.md) - passo per passo: eseguire l'intero stack sul proprio server.
  - [Configurazione](setup/configuration.md) - impostazioni, OIDC, ruoli, stringhe di connessione.
  - [Produzione](setup/production.md) - immagine Docker, flusso di release, migrazioni all'avvio.
- [Migrazioni](migrations.md) - script di migrazione EF Core e comportamento all'avvio.
- [Gestione dei plugin](plugin-management.md) - registro dei plugin a runtime, hot-swap, endpoint di amministrazione.
- [Come contribuire](contributing.md) - flusso issue → branch → PR e convenzioni.
