# Client API

Rigenera il client API Dart in `lib/api/` quando cambia l'API del backend. Non modificarlo a mano.
[openapi-generator](https://openapi-generator.tech) lo genera con il generatore `dart-dio` a partire
dal documento OpenAPI 3.0 di [SchulyServer](https://github.com/schulydev/SchulyServer). L'app lo usa
come pacchetto locale `schuly_api`, tramite un riferimento `path:` in `pubspec.yaml`.

## Rigenera il client

Avvia il backend su `http://localhost:5033`, poi esegui:

```sh
bun run apigen        # regenerate from http://localhost:5033/openapi/v1.json
bun run apigen:local  # same target, explicit local alias
```

`apigen` esegue tre passaggi:

1. **Generazione:** esegue `openapi-generator-cli generate -g dart-dio` sul documento attivo e
   scrive in `lib/api`, con `pubName=schuly_api` e `pubLibrary=schuly_api`.
2. **Patch (`apigen:patch`):** cambia il vincolo dell'SDK in `lib/api/pubspec.yaml`. Il generatore
   lo reimposta a `'>=2.18.0 <4.0.0'`, e questo rompe la build con un errore di versione del linguaggio
   nei part file. La patch imposta `^3.10.0`. È una riga `bun -e`, quindi funziona in qualsiasi shell.
3. **Build (`apigen:build`):** esegue `dart pub get` e
   `dart run build_runner build --delete-conflicting-outputs` in `lib/api` per produrre il codice di
   serializzazione `.g.dart`.

## Buono a sapersi

- `openapi.json` è in gitignore. Rigeneralo dal backend in esecuzione invece di fare il commit di una copia.
- `analysis_options.yaml` esclude `lib/api/**` da `flutter analyze`, quindi il codice generato non
  causa mai errori di lint.
- Se i file `.g.dart` non sono aggiornati, esegui `bun run apigen` o solo `bun run apigen:build`.
