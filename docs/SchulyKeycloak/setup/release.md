# Release

Releasing is driven by cutting a **GitHub release**. The
`.github/workflows/docker-publish-release.yaml` workflow runs on
`release: published` and does two things:

1. **`sync-version`** - compares `application.properties` to the release tag
   (stripping a leading `v`). If they differ, it opens a `release-sync/<tag>`
   branch, bumps `<version>` in `application.properties`, and auto-merges that PR
   into `main` (squash, branch deleted).
2. **`build-and-push-multiarch`** - builds the image for `linux/amd64` and
   `linux/arm64` and pushes it.

## Image tags

The metadata step derives tags from the release tag (semver):

- `:<semver>` (e.g. `:1.3.0`)
- `:<major>.<minor>` (e.g. `:1.3`)
- `:<major>` (e.g. `:1`)
- `:latest` (skipped for pre-releases)

Images are pushed to `ghcr.io/schulydev/schulykeycloak` and, best-effort, to Docker
Hub at `<DOCKERHUB_USERNAME>/schulykeycloak`.

## How to cut a release

1. Make sure `main` is green.
2. Create a GitHub release with a semver tag (e.g. `v1.3.0`). The workflow handles
   the version bump and image push - do not bump `application.properties` by hand.

## Required secrets

| Secret | Purpose |
|---|---|
| `MAIN_PUSH_TOKEN` | Lets the `sync-version` job push the version-bump branch to `main` and open/merge the sync PR. **Required.** |
| `DOCKERHUB_USERNAME` | Docker Hub namespace + login. Optional - the Docker Hub login/push is best-effort (`continue-on-error`). |
| `DOCKERHUB_TOKEN` | Docker Hub access token. Optional, as above. |

`GITHUB_TOKEN` (provided automatically) is used to push to GHCR.
