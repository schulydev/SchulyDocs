# Client API

Il client API Dart in `lib/api/` è **generato**, non scritto a mano. Viene prodotto
da [openapi-generator](https://openapi-generator.tech) (generatore `dart-dio`) a
partire dalla specifica OpenAPI 3.0 di
[SchulyBackend](https://github.com/schulydev/SchulyBackend), servita su
`/openapi/v1.json`. L'app lo importa come package locale tramite un riferimento
`path:` in `pubspec.yaml` (`schuly_api`).

## Rigenerazione

Il backend deve essere in esecuzione e raggiungibile su `http://localhost:5033`. Poi:

```sh
bun run apigen        # rigenera da http://localhost:5033/openapi/v1.json
bun run apigen:local  # stessa destinazione, alias locale esplicito
```

`apigen` concatena tre passaggi:

1. **Generazione** - `openapi-generator-cli generate -g dart-dio` contro la specifica
   live (`http://localhost:5033/openapi/v1.json`), output in `lib/api`
   (`pubName=schuly_api`, `pubLibrary=schuly_api`).
2. **Patch** (`apigen:patch`) - riscrive il vincolo SDK in `lib/api/pubspec.yaml`. Il
   generatore lo reimposta a `'>=2.18.0 <4.0.0'`, il che rompe la build a causa di un
   disallineamento di versione del linguaggio sui part-file. La patch lo sostituisce
   con `^3.10.0`. Implementata come one-liner `bun -e`, così viene eseguita in modo
   identico su qualsiasi shell.
3. **Build** (`apigen:build`) - `cd lib/api && dart pub get && dart run build_runner
   build --delete-conflicting-outputs` per produrre il codice di serializzazione
   `.g.dart`.

## Note

- **`openapi.json` è in gitignore** - rigenera sempre dal backend in esecuzione
  anziché fare commit di una copia locale della specifica.
- `lib/api/**` è **escluso da `flutter analyze`** (vedi `analysis_options.yaml`),
  così l'output del generatore non fa mai scattare i controlli di lint.
- I file `.g.dart` generati sono prodotti da `build_runner`; se diventano obsoleti,
  esegui di nuovo `bun run apigen` (o solo il passaggio `apigen:build`) per
  aggiornarli.

## Vedi anche

- [Configurazione per lo sviluppo](setup/development.md) - installazione delle
  dipendenze, esecuzione dell'app.
