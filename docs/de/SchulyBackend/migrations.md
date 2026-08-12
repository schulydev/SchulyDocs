# Migrationen

EF Core Migrationen liegen in `Schuly.Infrastructure`, mit `Schuly.API` als
Startup-Projekt. Hilfsskripte in `scripts/` kapseln die `dotnet ef`-Befehle.

## Migrationen verwalten (bash)

`scripts/migration.sh` verwendet Subcommands:

```sh
./scripts/migration.sh add <Name>      # neue Migration hinzufügen
./scripts/migration.sh remove          # letzte Migration entfernen
./scripts/migration.sh list            # alle Migrationen auflisten
./scripts/migration.sh update [Name]   # Migrationen anwenden (optional bis <Name>)
./scripts/migration.sh drop            # Datenbank löschen
```

Jeder Subcommand zielt auf `--project src/Schuly.Infrastructure
--startup-project src/Schuly.API`.

## Windows

- `scripts/migration.ps1` / `scripts/migration.bat` - PowerShell- bzw.
  Batch-Äquivalente.
- `scripts/DbScript.ps1` - kapselt Helfer für den DB-Lifecycle (Dev-Datenbank
  starten/stoppen/neu erstellen, Migration hinzufügen, Migrationen löschen, kompletter
  Reset). Mit `-help` ausführen für die Befehlsliste.

## Anwendung beim Start

Migrationen werden automatisch angewendet, wenn die API startet:
`ApplyMigrations()` in `Program.cs` ruft `db.Database.Migrate()` auf. Der
School-Systems-Katalog wird danach eingespielt (seed-if-missing). Weder in der
Entwicklung noch in der Produktion ist ein manueller Anwendungsschritt nötig.

## Voraussetzungen

- Das `dotnet-ef`-Tool: `dotnet tool install --global dotnet-ef`.
- Ein laufendes Postgres, erreichbar über den `SchulyDatabase`-Connection-String
  (siehe [Konfiguration](setup/configuration.md)). Für lokale Arbeit mit
  `docker compose -f compose.dev.yml up -d` starten.
