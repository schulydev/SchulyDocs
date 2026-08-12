# API-Client

Der Dart-API-Client unter `lib/api/` ist **generiert**, nicht von Hand geschrieben. Er
wird von [openapi-generator](https://openapi-generator.tech) (Generator `dart-dio`) aus
der OpenAPI-3.0-Spezifikation von
[SchulyBackend](https://github.com/schulydev/SchulyBackend) erzeugt, die unter
`/openapi/v1.json` bereitgestellt wird. Die App bindet ihn als lokales Package über
eine `path:`-Referenz in `pubspec.yaml` ein (`schuly_api`).

## Neu generieren

Das Backend muss laufen und unter `http://localhost:5033` erreichbar sein. Dann:

```sh
bun run apigen        # Neugenerierung ab http://localhost:5033/openapi/v1.json
bun run apigen:local  # gleiches Ziel, expliziter lokaler Alias
```

`apigen` reiht drei Schritte aneinander:

1. **Generieren** - `openapi-generator-cli generate -g dart-dio` gegen die laufende
   Spezifikation (`http://localhost:5033/openapi/v1.json`), Ausgabe nach `lib/api`
   (`pubName=schuly_api`, `pubLibrary=schuly_api`).
2. **Patchen** (`apigen:patch`) - schreibt die SDK-Constraint in `lib/api/pubspec.yaml`
   um. Der Generator setzt sie auf `'>=2.18.0 <4.0.0'` zurück, was den Build wegen
   eines Sprachversions-Mismatches bei den Part-Dateien bricht. Der Patch ersetzt sie
   durch `^3.10.0`. Als `bun -e`-Einzeiler implementiert, damit er in jeder Shell
   identisch läuft.
3. **Bauen** (`apigen:build`) - `cd lib/api && dart pub get && dart run build_runner
   build --delete-conflicting-outputs`, um den `.g.dart`-Serialisierungscode zu
   erzeugen.

## Hinweise

- **`openapi.json` ist gitignored** - immer aus dem laufenden Backend neu generieren,
  statt eine lokale Kopie der Spezifikation zu committen.
- `lib/api/**` ist **von `flutter analyze` ausgeschlossen** (siehe
  `analysis_options.yaml`), damit die Generator-Ausgabe nie Lint-Checks auslöst.
- Die generierten `.g.dart`-Dateien werden von `build_runner` erzeugt; werden sie
  veraltet, führe `bun run apigen` (oder nur den Schritt `apigen:build`) erneut aus,
  um sie zu aktualisieren.

## Siehe auch

- [Entwicklungsumgebung](setup/development.md) - Abhängigkeiten installieren, App
  ausführen.
