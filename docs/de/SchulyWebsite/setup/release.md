# Release

Die Versionierung richtet sich nach **`application.properties`** (der Single Source
of Truth, einer XML-Datei mit einem `<version>`-Element).

## Wie ein Release geschnitten wird

1. Veröffentliche ein GitHub Release mit einem Tag (z. B. `v0.1.0`).
2. Der Workflow `sync-version-on-release.yml` läuft bei `release: published` und
   aktualisiert, falls sich die Tag-Version von der Datei unterscheidet, beides:
   - die `<version>` in `application.properties` und
   - die oberste `"version"` in `package.json`

   und öffnet anschliessend einen `release-sync/<version>`-PR zurück nach `main`,
   den er automatisch mergt.

Stimmt die Version in der Datei bereits mit dem Tag überein, tut der Workflow nichts.

## Siehe auch

- [Deployment](deployment.md)
- [Contributing](../contributing.md)
