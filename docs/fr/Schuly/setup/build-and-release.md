# Build & release

Produire des artefacts installables pour l'app Schuly. Toutes les commandes sont des
scripts `package.json` exécutés via bun - voir
[Configuration de développement](development.md) pour les prérequis et un aperçu des
flavors.

## APK de release

```sh
bun run build:apk:dev    # flutter build apk --flavor dev  --release
bun run build:apk:prod   # flutter build apk --flavor prod --release
```

| Flavor | ID d'application | Nom affiché |
| --- | --- | --- |
| `dev` | `com.schuly.app.dev` (suffixe de version `-DEV`) | **Schuly DEV** |
| `prod` | `com.schuly.app` | **Schuly** |

Les deux flavors s'installent côte à côte, si bien qu'un build dev n'écrase jamais un
build prod sur le même appareil.

### Pointer un build dev vers un backend personnalisé

```sh
BACKEND_BASE_URL=https://example.test bun run build:apk:dev:url
```

`build:apk:dev:url` transmet `$BACKEND_BASE_URL` via `--dart-define=BACKEND_BASE_URL`.

## Build iOS

```sh
bun run build:ios   # flutter build ios --flavor prod --no-codesign
```

Construit le flavor `prod` sans signature de code (à signer séparément dans Xcode ou
ta pipeline de signature).

## Installation via adb

Compile l'APK de release et l'installe sur l'appareil actuellement connecté via adb :

```sh
bun run install:dev    # build de l'APK dev, puis flutter install --flavor dev
bun run install:prod   # build de l'APK prod, puis flutter install --flavor prod
```

Pour tester contre un backend hébergé localement en USB, redirige d'abord le port du
backend afin que l'appareil puisse atteindre `localhost:5033` :

```sh
bun run adb:reverse        # adb reverse tcp:5033 tcp:5033
bun run install:dev:usb    # adb:reverse + install:dev
```

Pour installer un build dev pointant vers une URL de backend personnalisée :

```sh
BACKEND_BASE_URL=https://example.test bun run install:dev:url
```

## Icônes de l'app

L'icône du launcher est générée à partir de `assets/app_icon.png` via
`flutter_launcher_icons` (Android + iOS, configuré dans `pubspec.yaml`). Après avoir
modifié l'image source :

```sh
bun run icons   # dart run flutter_launcher_icons
```

## Voir aussi

- [Configuration de développement](development.md) - versions de SDK, exécution de
  l'app.
- [Client API](../api-client.md) - régénérer le client généré avant un build.
