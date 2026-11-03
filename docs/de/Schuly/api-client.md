# API-Client

Generiere den Dart-API-Client in `lib/api/` neu, wenn sich die Backend-API ändert. Bearbeite ihn nicht
von Hand. [openapi-generator](https://openapi-generator.tech) erzeugt ihn mit dem Generator `dart-dio`
aus dem OpenAPI-3.0-Dokument von [SchulyServer](https://github.com/schulydev/SchulyServer). Die App
nutzt ihn als lokales Package `schuly_api`, über eine `path:`-Referenz in `pubspec.yaml`.

## Client neu generieren

Starte das Backend auf `http://localhost:5033` und führe dann aus:

```sh
bun run apigen        # regenerate from http://localhost:5033/openapi/v1.json
bun run apigen:local  # same target, explicit local alias
```

`apigen` führt drei Schritte aus:

1. **Generieren:** führt `openapi-generator-cli generate -g dart-dio` gegen das Live-Dokument aus und
   schreibt nach `lib/api`, mit `pubName=schuly_api` und `pubLibrary=schuly_api`.
2. **Patchen (`apigen:patch`):** ändert die SDK-Einschränkung in `lib/api/pubspec.yaml`. Der Generator
   setzt sie auf `'>=2.18.0 <4.0.0'` zurück. Das bricht den Build mit einem Part-File-Fehler wegen
   unterschiedlicher Sprachversionen. Der Patch setzt `^3.10.0`. Er ist ein `bun -e`-Einzeiler und
   funktioniert deshalb in jeder Shell.
3. **Bauen (`apigen:build`):** führt `dart pub get` und
   `dart run build_runner build --delete-conflicting-outputs` in `lib/api` aus, um den
   `.g.dart`-Serialisierungscode zu erzeugen.

## Gut zu wissen

- `openapi.json` ist in gitignore eingetragen. Generiere neu aus dem laufenden Backend, statt eine Kopie
  zu committen.
- `analysis_options.yaml` schliesst `lib/api/**` von `flutter analyze` aus. Generierter Code löst deshalb
  nie Lint-Fehler aus.
- Wenn die `.g.dart`-Dateien veraltet sind, führe `bun run apigen` oder nur `bun run apigen:build` aus.
