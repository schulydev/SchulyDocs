# Contributing

Diese Seite enthält die Regeln und Prüfungen speziell für die Mobile App. Für Issues, Branches, Pull
Requests und Labels folge dem [gemeinsamen Workflow](/de/contribute/).

## Regeln

- Führe Tasks mit `bun run <script>` aus statt mit dem direkten Befehl, und nutze nicht npm, npx oder node.
- Nutze einen CLI-Generator, wenn es einen gibt, zum Beispiel `gh issue create` oder `gh pr create`.

## Prüfungen, bevor du einen Pull Request eröffnest

```sh
bun run analyze
bun run test
bun run format
```

CI führt `flutter analyze` und `flutter test` bei jedem Pull Request aus. Wenn du `android/**` oder
`pubspec.yaml` änderst, baut CI zusätzlich ein Debug-APK des Dev-Flavors.

Details findest du unter [Entwicklungsumgebung](setup/development.md).
