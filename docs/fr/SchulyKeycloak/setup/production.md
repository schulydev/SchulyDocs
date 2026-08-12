# Mise en production

En production, exécute l'image publiée
`ghcr.io/schulydev/schulykeycloak:latest` (ou un tag `:<semver>` figé - voir
[Release](release.md)). L'image est un build Keycloak **optimisé** (`kc.sh build`
s'exécute au moment du build de l'image), le point d'entrée à l'exécution démarre
donc avec `start --optimized --import-realm` pour un démarrage rapide. Elle est
préconstruite pour Postgres (`KC_DB=postgres`), avec health check et métriques
activés.

> Tu déploies toute la stack (Postgres + reverse proxy + TLS) depuis zéro ? Suis
> plutôt [Auto-hébergement de la stack complète](self-hosting.md) - tu y trouveras
> un docker-compose complet et un guide pour le premier admin.

## Exécution

```sh
docker run -p 8080:8080 \
  -e KC_DB_URL=jdbc:postgresql://db:5432/keycloak \
  -e KC_DB_USERNAME=keycloak \
  -e KC_DB_PASSWORD=... \
  -e KC_HOSTNAME=https://auth.schuly.dev \
  -e KC_PROXY_HEADERS=xforwarded \
  -e KC_HTTP_ENABLED=true \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=... \
  ghcr.io/schulydev/schulykeycloak:latest
```

Les variables essentielles sont la connexion à la base de données (`KC_DB_*`), le
nom d'hôte public (`KC_HOSTNAME`), les réglages du proxy quand tu es derrière un
proxy qui termine le TLS (`KC_PROXY_HEADERS`, `KC_HTTP_ENABLED`), et un admin de
démarrage pour le premier lancement (`KC_BOOTSTRAP_ADMIN_*`). La liste complète -
chaque variable, chaque port et chaque valeur par défaut intégrée - se trouve dans
la [référence de configuration](../configuration.md).

> **Sécurité :** l'admin de démarrage est temporaire - crée un vrai admin et retire
> les variables `KC_BOOTSTRAP_ADMIN_*` après le premier démarrage. Ne commite jamais
> de secrets et ne les place pas dans `realms/schuly-realm.json`, termine le TLS au
> niveau du proxy, et n'expose jamais publiquement le port de management `9000`.
