# Référence de configuration

Tout ce que tu peux configurer sur l'image Schuly Keycloak, au même endroit. L'image
est un build Keycloak 26.6 **optimisé** : le fournisseur de base de données, le
health check et les métriques sont déjà figés au moment du build - à l'exécution, tu
fournis surtout la connexion à la base de données, le nom d'hôte public et un admin
de démarrage (bootstrap).

## Ports

| Port | Rôle | Exposer publiquement ? |
|---|---|---|
| `8080` | HTTP - pages de connexion, points de terminaison OIDC/SAML, console d'administration, API REST d'administration. | Oui, via ton reverse proxy (qui termine le TLS). |
| `9000` | Management - `/health`, `/health/ready`, `/health/live`, `/metrics`. | **Non.** À garder interne ; ne jamais l'exposer sur Internet via un proxy. |

## Variables d'environnement à l'exécution

À définir sur le conteneur (par ex. `environment:` dans Compose, ou `-e` avec
`docker run`).

| Variable | Requise | Rôle |
|---|---|---|
| `KC_DB_URL` | Oui | URL JDBC de la base Postgres, par ex. `jdbc:postgresql://db:5432/keycloak`. |
| `KC_DB_USERNAME` | Oui | Utilisateur de la base de données. |
| `KC_DB_PASSWORD` | Oui | Mot de passe de la base de données. |
| `KC_HOSTNAME` | Oui (prod) | URL publique à laquelle Keycloak est servi, par ex. `https://auth.schuly.dev`. Keycloak construit à partir de là toutes les URL d'issuer/redirection. |
| `KC_PROXY_HEADERS` | Oui (derrière un proxy) | À mettre à `xforwarded` quand un reverse proxy termine le TLS et transmet les en-têtes `X-Forwarded-*` (utiliser `forwarded` s'il envoie l'en-tête `Forwarded` du RFC 7239). |
| `KC_HTTP_ENABLED` | Oui (derrière un proxy) | `true` pour que le backend serve du HTTP simple sur `8080` pendant que le proxy gère le HTTPS. |
| `KC_BOOTSTRAP_ADMIN_USERNAME` | premier démarrage uniquement | Nom d'utilisateur temporaire de l'admin de démarrage. À utiliser une fois pour créer un vrai admin, puis à retirer. |
| `KC_BOOTSTRAP_ADMIN_PASSWORD` | premier démarrage uniquement | Mot de passe temporaire de l'admin de démarrage. |
| `KC_HTTP_PORT` | - | Change le port HTTP (par défaut `8080`). |
| `KC_LOG_LEVEL` | - | Niveau de log racine (par ex. `info`, `debug`). |

> Ne définis pas `KC_DB` - l'image est construite pour Postgres. Changer de
> fournisseur nécessiterait de reconstruire l'image optimisée.

## SMTP (e-mail du realm)

Le serveur mail du realm `schuly` est renseigné à partir des variables
d'environnement du conteneur au démarrage - le realm contient des placeholders
`${env.SMTP_*}` que `scripts/resolve-realm-env.sh` résout avant l'exécution de
l'import. Si tu les laisses vides, le realm est importé sans serveur mail
fonctionnel, ce qui ne pose pas de problème tant que tu n'as pas besoin des e-mails
vérifiés ou de la réinitialisation de mot de passe en libre-service.

| Variable | Requise | Rôle |
|---|---|---|
| `SMTP_HOST` | pour le mail | Nom d'hôte du serveur mail. |
| `SMTP_PORT` | pour le mail | Port du serveur mail, par ex. `587`. |
| `SMTP_FROM` | - | Adresse d'expéditeur. Par défaut `noreply@localhost` ; définis une vraie adresse avant d'activer le mail. |
| `SMTP_USER` | pour le mail | Nom d'utilisateur SMTP (le realm envoie `auth: true`). |
| `SMTP_PASSWORD` | pour le mail | Mot de passe SMTP. |
| `SMTP_SSL` | - | `true` pour du TLS implicite. |
| `SMTP_STARTTLS` | - | `true` pour STARTTLS. |

> Ces variables ne s'appliquent qu'au **premier** démarrage, lors de l'import du
> realm. Les modifier ensuite n'a aucun effet sur un realm existant - modifie plutôt
> les paramètres de mail dans la console d'administration (**Paramètres du realm →
> Email**).

## Réglages figés au moment du build

Ces réglages sont fixés au moment du build de l'image (`kc.sh build`) et ne se
modifient en général pas à l'exécution :

| Réglage | Valeur | Où |
|---|---|---|
| Fournisseur de base de données | `KC_DB=postgres` | `Dockerfile` (étape builder) |
| Points de terminaison health | `KC_HEALTH_ENABLED=true` | `Dockerfile` (étape builder) |
| Point de terminaison métriques | `KC_METRICS_ENABLED=true` | `Dockerfile` (étape builder) |
| Commande de démarrage | `start --optimized --import-realm` | `Dockerfile` (`CMD`) |
| Chemin de la liste noire de mots de passe | `JAVA_OPTS_APPEND=-Dkeycloak.password.blacklists.path=…` | `Dockerfile` (`ENV`) |

## Comportement figé

- **Import du realm** - le realm `schuly` est importé au **premier** démarrage. Aux
  démarrages suivants, un realm existant reste inchangé. Voir
  [Gestion du realm](realm-management.md).
- **Liste noire des mots de passe compromis** - la liste rockyou se trouve dans
  `/opt/keycloak/password-blacklists/rockyou.txt` ; la politique de mot de passe du
  realm utilise `passwordBlacklist(rockyou.txt)`.
- **Thème de connexion** - le thème Keycloakify `schuly` est installé comme provider
  jar et sélectionné par le realm (`loginTheme: "schuly"`). Voir
  [Développement du thème](theme-development.md).

## Volumes

En production (Postgres), tout l'état vit dans la base de données, donc **aucun
volume n'est nécessaire**. Les fichiers d'import du realm sont intégrés dans l'image
sous `/opt/keycloak/data/import`.

Le développement local est différent : il utilise une base H2 embarquée persistée
dans le volume nommé `keycloak-data-dev` - voir
[Environnement de développement](setup/development.md).
