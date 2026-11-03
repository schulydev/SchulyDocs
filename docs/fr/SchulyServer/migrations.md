# Migrations

Utilise cette page pour ajouter et gérer les migrations EF Core. Elles se trouvent dans `Schuly.Infrastructure`,
avec `Schuly.API` comme projet de démarrage. Les scripts de `scripts/` enveloppent les commandes `dotnet ef`.

## Prérequis

- Installe l'outil : `dotnet tool install --global dotnet-ef`.
- Fais tourner un Postgres que la chaîne de connexion `SchulyDatabase` peut atteindre. Voir
  [Configuration](setup/configuration.md). Pour le travail en local, exécute
  `docker compose -f compose.dev.yml up -d`.

## Ajouter et gérer les migrations

```sh
./scripts/migration.sh add <Name>      # add a new migration
./scripts/migration.sh remove          # remove the last migration
./scripts/migration.sh list            # list all migrations
./scripts/migration.sh update [Name]   # apply migrations, optionally up to <Name>
./scripts/migration.sh drop            # drop the database
```

Chaque sous-commande utilise `--project src/Schuly.Infrastructure --startup-project src/Schuly.API`.

Sous Windows, utilise `scripts/migration.ps1` ou `scripts/migration.bat` avec les mêmes sous-commandes.

## Gérer la base de données de développement sous Windows

`scripts/DbScript.ps1` contrôle la base de données de `compose.dev.yml`. Exécute-le avec `-help` pour voir la
liste des commandes.

| Commande | Ce qu'elle fait |
|---|---|
| `-start-db` | Démarre la stack compose |
| `-stop-db` | Arrête la stack compose |
| `-recreate-db` | Arrête la stack, exécute `docker volume prune -f` et la redémarre |

N'utilise pas ses commandes `-add-migration`, `-delete-migrations` ou `-full-reset`. Elles pointent vers
`src\DockiUp.Infrastructure`, qui n'existe pas dans ce dépôt. Utilise plutôt les scripts de migration.

## Application au démarrage

L'API applique les migrations à son démarrage : `ApplyMigrations()` dans `Program.cs` appelle
`db.Database.Migrate()`. Elle initialise ensuite le catalogue des systèmes scolaires si des entrées manquent. Tu
n'as pas besoin d'une étape d'application manuelle en développement ni en production.
