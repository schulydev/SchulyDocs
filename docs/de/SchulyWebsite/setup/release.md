# Release

Nutze diese Seite, um ein Release zu erstellen. Das Element `<version>` in `application.properties`, einer XML-Datei, ist die
Quelle der Version.

## Release erstellen

1. Veröffentliche ein GitHub-Release mit einem Tag wie `v0.1.0`. Release Drafter hält aus Pushes auf `main` einen Entwurf
   bereit.
2. `sync-version-on-release.yml` läuft und vergleicht den Tag mit `application.properties`. Stimmen sie überein, stoppt es.
3. Wenn sie sich unterscheiden, aktualisiert es `<version>` in `application.properties` und das oberste `version` in
   `package.json` und führt dann einen `release-sync/<version>`-Pull-Request per Squash-Merge in `main` zusammen.

Dieser Merge erreicht die Produktion über das [normale Deployment](deployment.md).
