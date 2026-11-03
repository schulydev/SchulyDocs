# Release

Utilise cette page pour faire une release. L'élément `<version>` dans `application.properties`, un fichier XML, est la
source de vérité pour la version.

## Faire une release

1. Publie une release GitHub avec un tag comme `v0.1.0`. Release Drafter garde un brouillon prêt à partir des pushes
   vers `main`.
2. `sync-version-on-release.yml` s'exécute et compare le tag à `application.properties`. S'ils correspondent, il
   s'arrête.
3. S'ils diffèrent, il met à jour `<version>` dans `application.properties` et le `version` de premier niveau dans
   `package.json`, puis fusionne en squash une pull request `release-sync/<version>` dans `main`.

Cette fusion arrive en production par le [déploiement normal](deployment.md).
