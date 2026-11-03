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

`scripts/DbScript.ps1` controlla il database in `compose.dev.yml` e le tue migrazioni. Eseguilo con `-help` per l'elenco dei comandi.

| Comando | Cosa fa |
|---|---|
| `-start-db` | Avvia lo stack Compose |
| `-stop-db` | Ferma lo stack Compose |
| `-recreate-db` | Ferma lo stack, elimina i suoi volumi e lo riavvia. Il tuo database locale va perso. |
| `-add-migration` | Chiede un nome e aggiunge una migrazione |
| `-delete-migrations` | Elimina la cartella `Migrations` |
| `-full-reset` | Elimina la cartella `Migrations` e i volumi dello stack, riavvia lo stack e aggiunge una migrazione `Init` |

Non fare il commit del risultato di `-delete-migrations` o `-full-reset`. I database esistenti dipendono dalle migrazioni attuali.

## Applicate all'avvio

L'API applica le migrazioni all'avvio: `ApplyMigrations()` in `Program.cs` chiama
`db.Database.Migrate()`. Poi inizializza il catalogo dei sistemi scolastici se mancano delle voci. Non serve
un passaggio manuale di applicazione né in sviluppo né in produzione.
