# Release

Une release est déclenchée en créant une **release GitHub**. Le workflow
`.github/workflows/docker-publish-release.yaml` s'exécute sur `release: published`
et fait deux choses :

1. **`sync-version`** - compare `application.properties` au tag de release (en
   retirant un éventuel `v` en tête). En cas de différence, il ouvre une branche
   `release-sync/<tag>`, incrémente `<version>` dans `application.properties`, et
   fusionne automatiquement cette PR dans `main` (squash, branche supprimée).
2. **`build-and-push-multiarch`** - construit l'image pour `linux/amd64` et
   `linux/arm64` et la publie.

## Tags d'image

L'étape de métadonnées dérive les tags à partir du tag de release (semver) :

- `:<semver>` (par ex. `:1.3.0`)
- `:<major>.<minor>` (par ex. `:1.3`)
- `:<major>` (par ex. `:1`)
- `:latest` (omis pour les pré-releases)

Les images sont publiées sur `ghcr.io/schulydev/schulykeycloak` et, dans la mesure
du possible, également sur Docker Hub sous
`<DOCKERHUB_USERNAME>/schulykeycloak`.

## Comment créer une release

1. Assure-toi que `main` est au vert.
2. Crée une release GitHub avec un tag semver (par ex. `v1.3.0`). Le workflow
   se charge de l'incrément de version et de la publication de l'image -
   n'incrémente pas `application.properties` à la main.

## Secrets requis

| Secret | Rôle |
|---|---|
| `MAIN_PUSH_TOKEN` | Permet au job `sync-version` de pousser la branche d'incrément de version vers `main` et d'ouvrir/fusionner la PR de synchronisation. **Requis.** |
| `DOCKERHUB_USERNAME` | Namespace + identifiant Docker Hub. Optionnel - la connexion/publication sur Docker Hub se fait dans la mesure du possible (`continue-on-error`). |
| `DOCKERHUB_TOKEN` | Jeton d'accès Docker Hub. Optionnel, comme ci-dessus. |

`GITHUB_TOKEN` (fourni automatiquement) est utilisé pour publier vers le GHCR.
