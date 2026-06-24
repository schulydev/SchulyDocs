# Release

Versioning is driven by **`application.properties`** (the single source of truth,
an XML file with a `<version>` element).

## How a release is cut

1. Publish a GitHub Release with a tag (e.g. `v0.1.0`).
2. The `sync-version-on-release.yml` workflow runs on `release: published` and,
   if the tag version differs from the file, updates both:
   - the `<version>` in `application.properties`, and
   - the top-level `"version"` in `package.json`
   then opens and auto-merges a `release-sync/<version>` PR back into `main`.

If the file version already matches the tag, the workflow is a no-op.

## Related

- [Deployment](deployment.md)
- [Contributing](../contributing.md)
