# Migrazioni

Usa questa pagina per aggiungere e gestire le migrazioni EF Core. Si trovano in `Schuly.Infrastructure`, con
`Schuly.API` come progetto di avvio. Gli script in `scripts/` incapsulano i comandi `dotnet ef`.

## Prerequisiti

- Installa lo strumento: `dotnet tool install --global dotnet-ef`.
- Esegui un Postgres raggiungibile dalla connection string `SchulyDatabase`. Vedi
  [Configurazione](setup/configuration.md). Per il lavoro in locale, esegui
  `docker compose -f compose.dev.yml up -d`.

## Aggiungi e gestisci le migrazioni

```sh
./scripts/migration.sh add <Name>      # add a new migration
./scripts/migration.sh remove          # remove the last migration
./scripts/migration.sh list            # list all migrations
./scripts/migration.sh update [Name]   # apply migrations, optionally up to <Name>
./scripts/migration.sh drop            # drop the database
```

Ogni sottocomando usa `--project src/Schuly.Infrastructure --startup-project src/Schuly.API`.

Su Windows, usa `scripts/migration.ps1` o `scripts/migration.bat` con gli stessi sottocomandi.

## Gestisci il database di sviluppo su Windows

`scripts/DbScript.ps1` controlla il database in `compose.dev.yml`. Eseguilo con `-help` per l'elenco dei
comandi.

| Comando | Cosa fa |
|---|---|
| `-start-db` | Avvia lo stack compose |
| `-stop-db` | Ferma lo stack compose |
| `-recreate-db` | Ferma lo stack, esegue `docker volume prune -f` e lo avvia di nuovo |

Non usare i suoi comandi `-add-migration`, `-delete-migrations` o `-full-reset`. Puntano a
`src\DockiUp.Infrastructure`, che non esiste in questo repository. Usa invece gli script di migrazione.

## Applicate all'avvio

L'API applica le migrazioni all'avvio: `ApplyMigrations()` in `Program.cs` chiama
`db.Database.Migrate()`. Poi inizializza il catalogo dei sistemi scolastici se mancano delle voci. Non serve
un passaggio manuale di applicazione né in sviluppo né in produzione.
