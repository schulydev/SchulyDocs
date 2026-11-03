# Faire tourner et mettre à jour ton serveur

Les tâches courantes pour un serveur mis en place avec [Auto-héberger Schuly](self-hosting.md). Exécute
les commandes depuis le dossier `deploy`.

## Sauvegarder

Toutes les données se trouvent dans `deploy/data`. Sauvegarde ces éléments :

- `data/postgres` : les comptes et les données scolaires
- `data/seaweedfs` : les documents et les photos de profil
- `.env` : les clés. Sans elles, une partie de la sauvegarde est illisible.

## Mettre à jour

1. Sauvegarde `data/postgres`.
2. Définis la nouvelle `SCHULY_VERSION` dans `.env`.
3. Exécute `docker compose -f compose.staging.yml up -d`.

Schuly met à jour sa base de données au démarrage. Pour confirmer la version, ouvre
`https://<your domain>/api/app` et lis le champ `version`.

## Supprimer toutes les données

Arrête la pile, puis supprime le dossier `data` :

```sh
docker compose -f compose.staging.yml down
rm -rf data
```

## Durée de conservation des données

Une fois par jour, Schuly supprime les données expirées :

| Données | Supprimées après | Paramètre |
|---|---|---|
| Données scolaires d'un élève qui est parti | 6 mois après la date de départ | `Retention__MonthsAfterLeave` |
| Données Schuly d'un compte inactif | 12 mois sans requête | `Retention__MonthsInactive` |

Modifie ces valeurs dans `config/backend.env`, ou désactive la purge avec `Retention__Enabled`. Le
compte de connexion reste, donc une personne dont les données ont expiré peut se connecter et
synchroniser à nouveau.

Quand des utilisateurs suppriment leur compte, Schuly efface immédiatement leurs données scolaires,
leurs documents et leurs informations de connexion.

## Migrer depuis Keycloak

Les anciens serveurs utilisaient un conteneur Keycloak séparé. Les mots de passe ne peuvent pas être
migrés, les utilisateurs existants doivent donc s'inscrire à nouveau ou réinitialiser leur mot de
passe.

1. Ajoute les nouvelles clés de `.env.example` à `.env`.
2. Retire `AUTH_HOST`, `KEYCLOAK_VERSION` et toutes les variables `KC_*`.
3. Récupère depuis le dépôt les versions actuelles de `compose.staging.yml`, de `Caddyfile` et du dossier `config`.
