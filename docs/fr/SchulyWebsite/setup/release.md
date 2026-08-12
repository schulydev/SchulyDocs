# Release

Le versioning est piloté par **`application.properties`** (la source de vérité
unique, un fichier XML contenant un élément `<version>`).

## Comment une release est préparée

1. Publie une Release GitHub avec un tag (par ex. `v0.1.0`).
2. Le workflow `sync-version-on-release.yml` s'exécute sur `release: published` et,
   si la version du tag diffère de celle du fichier, met à jour les deux :
   - le `<version>` dans `application.properties`, et
   - le `"version"` de premier niveau dans `package.json`

   puis ouvre une PR `release-sync/<version>` vers `main` et la merge automatiquement.

Si la version du fichier correspond déjà au tag, le workflow ne fait rien.

## Voir aussi

- [Déploiement](deployment.md)
- [Contributing](../contributing.md)
