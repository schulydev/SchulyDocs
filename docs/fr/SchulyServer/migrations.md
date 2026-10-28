# Migrations

Les migrations EF Core vivent dans `Schuly.Infrastructure`, avec `Schuly.API` comme
projet de démarrage. Des scripts utilitaires dans `scripts/` encapsulent les commandes
`dotnet ef`.

## Ajouter / gérer les migrations (bash)

`scripts/migration.sh` utilise des sous-commandes :

```sh
./scripts/migration.sh add <Name>      # ajoute une nouvelle migration
./scripts/migration.sh remove          # supprime la dernière migration
./scripts/migration.sh list            # liste toutes les migrations
./scripts/migration.sh update [Name]   # applique les migrations (jusqu'à <Name> en option)
./scripts/migration.sh drop            # supprime la base de données
```

Chaque sous-commande cible `--project src/Schuly.Infrastructure --startup-project
src/Schuly.API`.

## Windows

- `scripts/migration.ps1` / `scripts/migration.bat` - équivalents PowerShell / batch.
- `scripts/DbScript.ps1` - encapsule les utilitaires de cycle de vie de la base de
  données (démarrer/arrêter/recréer la base de dev, ajouter une migration, supprimer
  des migrations, réinitialisation complète). Lance-le avec `-help` pour la liste des
  commandes.

## Appliquées au démarrage

Les migrations sont appliquées automatiquement au démarrage de l'API :
`ApplyMigrations()` dans `Program.cs` appelle `db.Database.Migrate()`. Le catalogue des
systèmes scolaires est ensuite alimenté (seed-if-missing : uniquement si absent). Aucune
étape d'application manuelle n'est nécessaire en développement ni en production.

## Prérequis

- L'outil `dotnet-ef` : `dotnet tool install --global dotnet-ef`.
- Un Postgres en cours d'exécution, accessible via la chaîne de connexion
  `SchulyDatabase` (voir [Configuration](setup/configuration.md)). Pour le travail en
  local, démarre-le avec `docker compose -f compose.dev.yml up -d`.
