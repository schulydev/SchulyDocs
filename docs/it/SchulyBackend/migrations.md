# Migrazioni

Le migrazioni EF Core risiedono in `Schuly.Infrastructure`, con `Schuly.API` come
progetto di avvio. Gli script di supporto in `scripts/` incapsulano i comandi
`dotnet ef`.

## Aggiungere / gestire le migrazioni (bash)

`scripts/migration.sh` usa dei sottocomandi:

```sh
./scripts/migration.sh add <Name>      # aggiunge una nuova migrazione
./scripts/migration.sh remove          # rimuove l'ultima migrazione
./scripts/migration.sh list            # elenca tutte le migrazioni
./scripts/migration.sh update [Name]   # applica le migrazioni (opzionalmente fino a <Name>)
./scripts/migration.sh drop            # elimina il database
```

Ogni sottocomando si rivolge a `--project src/Schuly.Infrastructure --startup-project
src/Schuly.API`.

## Windows

- `scripts/migration.ps1` / `scripts/migration.bat` - equivalenti PowerShell / batch.
- `scripts/DbScript.ps1` - incapsula funzioni di supporto per il ciclo di vita del
  database (avvio/arresto/ricreazione del database di sviluppo, aggiunta di
  migrazioni, eliminazione di migrazioni, reset completo). Eseguilo con `-help` per
  l'elenco dei comandi.

## Applicazione all'avvio

Le migrazioni vengono applicate automaticamente all'avvio dell'API:
`ApplyMigrations()` in `Program.cs` chiama `db.Database.Migrate()`. Il catalogo dei
sistemi scolastici viene poi popolato (seed-if-missing, ossia solo se mancante).
Non è necessario alcun passaggio manuale di applicazione, né in sviluppo né in
produzione.

## Prerequisiti

- Lo strumento `dotnet-ef`: `dotnet tool install --global dotnet-ef`.
- Un'istanza Postgres in esecuzione, raggiungibile tramite la stringa di connessione
  `SchulyDatabase` (vedi [Configurazione](setup/configuration.md)). Per il lavoro
  locale, avviala con `docker compose -f compose.dev.yml up -d`.
