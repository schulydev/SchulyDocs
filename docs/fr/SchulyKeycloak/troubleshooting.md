# Dépannage

Les problèmes courants, leurs causes et comment les résoudre.

## La page de connexion ressemble à Keycloak par défaut (pas aux couleurs de Schuly)

Le jar du thème `schuly` n'est pas chargé, ou le realm ne l'utilise pas.

- Vérifie que le `loginTheme` du realm est bien `schuly` (`realms/schuly-realm.json`).
- Si tu as modifié le code du thème, reconstruis l'image - le thème est intégré au
  moment du build, pas chargé à l'exécution :
  `docker compose -f compose.dev.yml up --build`. Voir
  [Développement du thème](theme-development.md).

## Redirections infinies, « HTTPS required », ou mauvaises URL dans le navigateur

Keycloak ne connaît pas son URL publique, ou ne fait pas confiance aux en-têtes du
proxy.

- Définis `KC_HOSTNAME` sur l'URL publique complète (par ex.
  `https://auth.schuly.dev`).
- Derrière un proxy qui termine le TLS, définis `KC_PROXY_HEADERS=xforwarded` et
  `KC_HTTP_ENABLED=true`, et assure-toi que le proxy transmet les en-têtes
  `X-Forwarded-*`.
- Voir [Auto-hébergement de la stack complète](setup/self-hosting.md).

## Les modifications du JSON du realm n'apparaissent pas

Le realm n'est importé qu'au **premier** démarrage ; ensuite, un realm existant
reste tel quel.

- **Développement local :** réinitialise le volume de données pour réimporter -
  `docker compose -f compose.dev.yml down -v && docker compose -f compose.dev.yml up --build`.
- **Production :** le realm existe déjà dans Postgres ; applique les changements
  dans la console d'administration et capture-les en retour avec le script d'export
  (voir [Gestion du realm](realm-management.md)). Ne t'attends pas à ce que le JSON
  fourni écrase un realm en production.

## Le health check échoue / `/health` inaccessible

Le health check et les métriques sont sur le **port de management `9000`**, pas sur
`8080`.

- Accède à `http://<host>:9000/health/ready` depuis l'intérieur du réseau (il
  n'est volontairement pas exposé via un proxy sur Internet).

## L'admin de démarrage (bootstrap) ne peut pas se connecter

`KC_BOOTSTRAP_ADMIN_USERNAME` / `KC_BOOTSTRAP_ADMIN_PASSWORD` ne créent un compte
qu'au **premier** démarrage d'une base de données neuve. Si la base avait déjà un
admin, ces variables n'ont aucun effet - utilise l'admin existant, ou réinitialise
via l'API REST d'administration.

## Erreurs de connexion à la base de données au démarrage

- Vérifie `KC_DB_URL`, `KC_DB_USERNAME`, `KC_DB_PASSWORD`, et que Postgres est
  accessible et accepte les connexions (attends que son health check soit bon avant
  que Keycloak démarre).
- L'image est construite exclusivement pour Postgres - ne remplace pas `KC_DB`.

## Les nouveaux utilisateurs ne sont pas invités à configurer la 2FA / une clé d'accès

Le comportement d'inscription à la 2FA est défini par le flux `browser-2fa` et les
actions requises - voir la section 2FA de la [Gestion du realm](realm-management.md),
y compris la remarque sur la migration pour les utilisateurs préexistants.
