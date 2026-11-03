# Contributing

Diese Seite enthält die Regeln und Prüfungen speziell für die Website. Für Issues, Branches, Pull Requests und Labels folge
dem [gemeinsamen Workflow](/de/contribute/).

## Regeln

- Nutze Bun für alles, nicht npm, npx oder node.
- Folge den [Angular-20-Coding-Konventionen](architecture.md#angular-20-coding-conventions).
- Wenn du eine Sprache oder eine Seite hinzufügst, aktualisiere `scripts/postbuild.ts`. Siehe
  [Routen und Sprachen](architecture.md#routen-und-sprachen).

## Prüfungen

CI führt diese bei Pushes und Pull Requests auf `main` aus. Führe sie aus, bevor du einen Pull Request eröffnest:

```sh
bun install --frozen-lockfile
bun run build
```

Führe auch die Unit-Tests aus. CI führt sie nicht aus.

```sh
bun run test
```
