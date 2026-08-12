# Release

Il rilascio viene avviato creando una **release GitHub**. Il workflow
`.github/workflows/docker-publish-release.yaml` viene eseguito su
`release: published` e fa due cose:

1. **`sync-version`** - confronta `application.properties` con il tag di release
   (rimuovendo un'eventuale `v` iniziale). Se differiscono, apre un branch
   `release-sync/<tag>`, incrementa `<version>` in `application.properties` e fa
   il merge automatico di quella PR in `main` (squash, branch eliminato).
2. **`build-and-push-multiarch`** - compila l'immagine per `linux/amd64` e
   `linux/arm64` e la pubblica.

## Tag delle immagini

Lo step dei metadati deriva i tag dal tag di release (semver):

- `:<semver>` (es. `:1.3.0`)
- `:<major>.<minor>` (es. `:1.3`)
- `:<major>` (es. `:1`)
- `:latest` (omesso per le pre-release)

Le immagini vengono pubblicate su `ghcr.io/schulydev/schulykeycloak` e, con il
massimo impegno possibile, anche su Docker Hub in
`<DOCKERHUB_USERNAME>/schulykeycloak`.

## Come creare una release

1. Assicurati che `main` sia verde.
2. Crea una release GitHub con un tag semver (es. `v1.3.0`). Il workflow gestisce
   l'incremento della versione e la pubblicazione dell'immagine - non incrementare
   `application.properties` a mano.

## Secret richiesti

| Secret | Scopo |
|---|---|
| `MAIN_PUSH_TOKEN` | Permette al job `sync-version` di pushare il branch con l'incremento di versione su `main` e di aprire/mergiare la PR di sincronizzazione. **Richiesto.** |
| `DOCKERHUB_USERNAME` | Namespace + login Docker Hub. Opzionale - login/push su Docker Hub avvengono con il massimo impegno possibile (`continue-on-error`). |
| `DOCKERHUB_TOKEN` | Token di accesso Docker Hub. Opzionale, come sopra. |

`GITHUB_TOKEN` (fornito automaticamente) viene usato per il push verso GHCR.
