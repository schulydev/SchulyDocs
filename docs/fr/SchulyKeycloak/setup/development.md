# Environnement de développement

Exécute l'image Schuly Keycloak complète en local - thème, liste noire et realm
`schuly` déjà intégrés - avec Docker Compose.

## Prérequis

- Docker (avec le plugin Compose : `docker compose`).

## Exécution

```sh
docker compose -f compose.dev.yml up --build
```

Cela construit l'image à partir du `Dockerfile` et démarre Keycloak en mode
développement (`start-dev --import-realm`).

- Console d'administration : <http://localhost:8080>
- Identifiants admin : `admin` / `admin` (définis via `KC_BOOTSTRAP_ADMIN_USERNAME` /
  `KC_BOOTSTRAP_ADMIN_PASSWORD` dans `compose.dev.yml`).
- Le realm `schuly` est importé automatiquement depuis `./realms` au premier
  démarrage.

Le mode développement utilise une base H2 embarquée et persiste les données dans le
volume nommé `keycloak-data-dev`, donc les changements survivent aux redémarrages.
Le dossier `./realms` est monté en lecture seule sur `/opt/keycloak/data/import`,
qui est aussi l'endroit où le script d'export écrit ses instantanés (voir
[Gestion du realm](../realm-management.md)).

## Réinitialiser l'état local

Pour repartir d'un import de realm propre, supprime le volume de données :

```sh
docker compose -f compose.dev.yml down -v
docker compose -f compose.dev.yml up --build
```
