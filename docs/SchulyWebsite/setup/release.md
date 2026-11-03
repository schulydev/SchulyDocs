# Release

Use this page to cut a release. The `<version>` element in `application.properties`, an XML file, is the
source of truth for the version.

## Cut a release

1. Publish a GitHub release with a tag such as `v0.1.0`. Release Drafter keeps a draft ready from pushes
   to `main`.
2. `sync-version-on-release.yml` runs and compares the tag to `application.properties`. If they match,
   it stops.
3. If they differ, it updates `<version>` in `application.properties` and the top-level `version` in
   `package.json`, then squash-merges a `release-sync/<version>` pull request into `main`.

That merge reaches production through the [normal deploy](deployment.md).
