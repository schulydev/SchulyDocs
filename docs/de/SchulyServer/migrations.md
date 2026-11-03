# Migrationen

Nutze diese Seite, um EF-Core-Migrationen hinzuzufügen und zu verwalten. Sie liegen in `Schuly.Infrastructure`, mit
`Schuly.API` als Startup-Projekt. Die Skripte in `scripts/` kapseln die `dotnet ef`-Befehle.

## Voraussetzungen

- Installiere das Tool: `dotnet tool install --global dotnet-ef`.
- Betreibe ein Postgres, das der Connection-String `SchulyDatabase` erreichen kann. Siehe
  [Konfiguration](setup/configuration.md). Führe für die lokale Arbeit `docker compose -f compose.dev.yml up -d` aus.

## Migrationen hinzufügen und verwalten

```sh
./scripts/migration.sh add <Name>      # add a new migration
./scripts/migration.sh remove          # remove the last migration
./scripts/migration.sh list            # list all migrations
./scripts/migration.sh update [Name]   # apply migrations, optionally up to <Name>
./scripts/migration.sh drop            # drop the database
```

Jeder Unterbefehl nutzt `--project src/Schuly.Infrastructure --startup-project src/Schuly.API`.

Nutze unter Windows `scripts/migration.ps1` oder `scripts/migration.bat` mit denselben Unterbefehlen.

## Dev-Datenbank unter Windows verwalten

`scripts/DbScript.ps1` steuert die Datenbank in `compose.dev.yml`. Führe es mit `-help` aus, um die Befehlsliste zu sehen.

| Befehl | Was er macht |
|---|---|
| `-start-db` | Startet den Compose-Stack |
| `-stop-db` | Stoppt den Compose-Stack |
| `-recreate-db` | Stoppt den Stack, führt `docker volume prune -f` aus und startet ihn wieder |

Nutze seine Befehle `-add-migration`, `-delete-migrations` und `-full-reset` nicht. Sie zeigen auf
`src\DockiUp.Infrastructure`, das in diesem Repo nicht existiert. Nutze stattdessen die Migrationsskripte.

## Beim Start angewendet

Die API wendet Migrationen beim Start an: `ApplyMigrations()` in `Program.cs` ruft `db.Database.Migrate()` auf. Danach
befüllt sie den Schulsystem-Katalog, wenn Einträge fehlen. Du brauchst weder in der Entwicklung noch in der Produktion
einen manuellen Schritt.
