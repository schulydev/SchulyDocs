# Client API

Régénère le client API Dart dans `lib/api/` quand l'API du backend change. Ne le modifie pas à la main.
[openapi-generator](https://openapi-generator.tech) le génère avec le générateur `dart-dio` à partir du
document OpenAPI 3.0 de [SchulyServer](https://github.com/schulydev/SchulyServer). L'application l'utilise
comme package local `schuly_api`, par une référence `path:` dans `pubspec.yaml`.

## Régénérer le client

Démarre le backend sur `http://localhost:5033`, puis exécute :

```sh
bun run apigen        # regenerate from http://localhost:5033/openapi/v1.json
bun run apigen:local  # same target, explicit local alias
```

`apigen` exécute trois étapes :

1. **Génération :** exécute `openapi-generator-cli generate -g dart-dio` sur le document en direct et
   écrit dans `lib/api`, avec `pubName=schuly_api` et `pubLibrary=schuly_api`.
2. **Correctif (`apigen:patch`) :** modifie la contrainte de SDK dans `lib/api/pubspec.yaml`. Le
   générateur la remet à `'>=2.18.0 <4.0.0'`, ce qui casse le build avec une incohérence de version de
   langage dans les fichiers part. Le correctif définit `^3.10.0`. C'est une ligne `bun -e`, donc elle
   fonctionne dans n'importe quel shell.
3. **Build (`apigen:build`) :** exécute `dart pub get` et
   `dart run build_runner build --delete-conflicting-outputs` dans `lib/api` pour produire le code de
   sérialisation `.g.dart`.

## Bon à savoir

- `openapi.json` est ignoré par git. Régénère depuis le backend en cours d'exécution au lieu de commiter
  une copie.
- `analysis_options.yaml` exclut `lib/api/**` de `flutter analyze`, donc le code généré ne déclenche
  jamais d'erreurs de lint.
- Si les fichiers `.g.dart` ne sont plus à jour, exécute `bun run apigen` ou seulement
  `bun run apigen:build`.
