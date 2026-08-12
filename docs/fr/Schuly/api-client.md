# Client API

Le client API Dart dans `lib/api/` est **généré**, pas écrit à la main. Il est produit
par [openapi-generator](https://openapi-generator.tech) (générateur `dart-dio`) à
partir de la spécification OpenAPI 3.0 de
[SchulyBackend](https://github.com/schulydev/SchulyBackend), servie sur
`/openapi/v1.json`. L'app en dépend comme d'un package local via une référence
`path:` dans `pubspec.yaml` (`schuly_api`).

## Régénération

Le backend doit tourner et être accessible sur `http://localhost:5033`. Ensuite :

```sh
bun run apigen        # régénère depuis http://localhost:5033/openapi/v1.json
bun run apigen:local  # même cible, alias local explicite
```

`apigen` enchaîne trois étapes :

1. **Génération** - `openapi-generator-cli generate -g dart-dio` contre la
   spécification en direct (`http://localhost:5033/openapi/v1.json`), sortie dans
   `lib/api` (`pubName=schuly_api`, `pubLibrary=schuly_api`).
2. **Patch** (`apigen:patch`) - réécrit la contrainte de SDK dans
   `lib/api/pubspec.yaml`. Le générateur la remet à `'>=2.18.0 <4.0.0'`, ce qui casse
   le build à cause d'une incompatibilité de version de langage sur les fichiers
   part. Le patch la remplace par `^3.10.0`. Implémenté comme un one-liner `bun -e`
   afin qu'il s'exécute à l'identique quel que soit le shell.
3. **Build** (`apigen:build`) - `cd lib/api && dart pub get && dart run build_runner
   build --delete-conflicting-outputs` pour produire le code de sérialisation
   `.g.dart`.

## Remarques

- **`openapi.json` est gitignored** - régénère toujours depuis le backend en cours
  d'exécution plutôt que de committer une copie locale de la spécification.
- `lib/api/**` est **exclu de `flutter analyze`** (voir `analysis_options.yaml`), afin
  que la sortie du générateur ne déclenche jamais les vérifications de lint.
- Les fichiers `.g.dart` générés sont produits par `build_runner` ; s'ils deviennent
  obsolètes, relance `bun run apigen` (ou juste l'étape `apigen:build`) pour les
  actualiser.

## Voir aussi

- [Configuration de développement](setup/development.md) - installation des
  dépendances, exécution de l'app.
