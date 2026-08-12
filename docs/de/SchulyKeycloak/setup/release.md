# Release

Ein Release wird durch das Schneiden eines **GitHub-Release** ausgelöst. Der Workflow
`.github/workflows/docker-publish-release.yaml` läuft bei `release: published` und
erledigt zwei Dinge:

1. **`sync-version`** - vergleicht `application.properties` mit dem Release-Tag
   (ohne führendes `v`). Weichen sie voneinander ab, öffnet er einen
   `release-sync/<tag>`-Branch, erhöht `<version>` in `application.properties` und
   merged diesen PR automatisch in `main` (Squash, Branch wird gelöscht).
2. **`build-and-push-multiarch`** - baut das Image für `linux/amd64` und
   `linux/arm64` und pusht es.

## Image-Tags

Der Metadaten-Schritt leitet Tags aus dem Release-Tag (Semver) ab:

- `:<semver>` (z. B. `:1.3.0`)
- `:<major>.<minor>` (z. B. `:1.3`)
- `:<major>` (z. B. `:1`)
- `:latest` (wird bei Pre-Releases ausgelassen)

Images werden nach `ghcr.io/schulydev/schulykeycloak` gepusht und, nach bestem
Bemühen, zusätzlich zu Docker Hub unter
`<DOCKERHUB_USERNAME>/schulykeycloak`.

## So schneidest du ein Release

1. Stelle sicher, dass `main` grün ist.
2. Erstelle ein GitHub-Release mit einem Semver-Tag (z. B. `v1.3.0`). Der Workflow
   übernimmt den Versions-Bump und den Image-Push - erhöhe
   `application.properties` nicht von Hand.

## Erforderliche Secrets

| Secret | Zweck |
|---|---|
| `MAIN_PUSH_TOKEN` | Erlaubt dem `sync-version`-Job, den Versions-Bump-Branch nach `main` zu pushen und den Sync-PR zu öffnen/mergen. **Erforderlich.** |
| `DOCKERHUB_USERNAME` | Docker-Hub-Namespace + Login. Optional - Login/Push zu Docker Hub laufen nach bestem Bemühen (`continue-on-error`). |
| `DOCKERHUB_TOKEN` | Docker-Hub-Zugriffstoken. Optional, wie oben. |

`GITHUB_TOKEN` (automatisch bereitgestellt) wird für den Push zur GHCR verwendet.
