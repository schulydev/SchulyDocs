# Documentation SchulyKeycloak

L'image [Keycloak](https://www.keycloak.org/) propre à Schuly - le fournisseur
d'identité utilisé en production pour Schuly. Le conteneur embarque un thème de
connexion [Keycloakify](https://keycloakify.dev) (sous forme de provider jar), une
liste noire de mots de passe compromis (rockyou) et le realm `schuly`, puis est
livré comme un build Keycloak *optimisé* pour un démarrage rapide en production.
Les releases publient une image multi-architecture sur
`ghcr.io/schulydev/schulykeycloak`.

## Index de la documentation

**Premiers pas**
- [Environnement de développement](setup/development.md) - exécuter l'image en local avec Docker Compose.
- [Auto-hébergement de la stack complète](setup/self-hosting.md) - déployer Keycloak + Postgres + un proxy TLS en production.

**Guides**
- [Mise en production](setup/production.md) - exécuter l'image optimisée avec une base Postgres.
- [Gestion du realm](realm-management.md) - modifier et sauvegarder le realm `schuly` (dont la 2FA).
- [Développement du thème](theme-development.md) - travailler sur le thème de connexion Keycloakify.
- [Mode compte vs. mode privé](account-vs-privacy-mode.md) - comment les utilisateurs choisissent de se connecter.
- [Release](setup/release.md) - créer une release et publier les images.
- [Contribuer](contributing.md) - le workflow issue → branche → PR.

**Référence & contexte**
- [Référence de configuration](configuration.md) - chaque port, variable d'environnement et valeur par défaut.
- [Architecture](architecture.md) - comment le thème, le realm et l'image de base s'articulent, et le flux de connexion.
- [Dépannage](troubleshooting.md) - symptômes, causes et solutions.

## Structure du dépôt

Pertinent uniquement si tu modifies l'image elle-même.

| Chemin | Rôle |
|---|---|
| `Dockerfile` | Build multi-étapes : thème jar → liste noire rockyou → Keycloak 26.6 optimisé → image d'exécution. |
| `keycloakify/` | Le thème de connexion aux couleurs de Schuly (Keycloakify 11, React + Tailwind + shadcn). Compilé en provider jar au moment du build de l'image. |
| `realms/schuly-realm.json` | Le realm `schuly` (rôles, groupes, client scopes, flux navigateur 2FA). Importé au premier démarrage. |
| `compose.dev.yml` | Développement local : `start-dev --import-realm`, admin/admin sur `:8080`. |
| `scripts/keycloak-export.{sh,ps1,bat}` | Rapatrie les modifications du realm faites dans le conteneur en cours d'exécution vers `realms/`. |
| `.github/workflows/docker-publish-release.yaml` | Build et publie l'image multi-architecture lors d'une release GitHub. |
| `application.properties` | Source de vérité unique pour la version ; la CI la synchronise avec le tag de release. |
