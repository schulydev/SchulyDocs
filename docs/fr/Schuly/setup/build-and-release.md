# Build et release

Utilise cette page pour compiler des applications installables sur ta machine et pour publier une
release. Les commandes locales sont des scripts de `package.json`. Voir
[Configuration de développement](development.md) pour les prérequis et les flavors.

## Compiler des APK de release

```sh
bun run build:apk:dev    # flutter build apk --flavor dev --release
bun run build:apk:prod   # flutter build apk --flavor prod --release
```

Les scripts `prod` définissent `BACKEND_BASE_URL=https://api.schuly.dev`. Tous les scripts de build
transmettent les valeurs Firebase listées dans
[Configuration de développement](development.md#activer-les-notifications-push).

Les builds de release utilisent la clé de signature de `android/key.properties`. Sans ce fichier, ils
utilisent la clé de debug.

### Pointer un build de dev vers un backend personnalisé

```sh
BACKEND_BASE_URL=https://example.test bun run build:apk:dev:url
```

`build:apk:dev:url` transmet `$BACKEND_BASE_URL` par `--dart-define=BACKEND_BASE_URL`.

## Compiler pour iOS

```sh
bun run build:ios   # flutter build ios --flavor prod --no-codesign
```

Cette commande compile le flavor `prod` sans signature du code. Signe-le séparément, dans Xcode ou dans
ton pipeline de signature.

## Installer par adb

Ces scripts compilent un APK de release et l'installent sur la cible adb connectée :

```sh
bun run install:dev    # build the dev APK, then flutter install --flavor dev
bun run install:prod   # build the prod APK, then flutter install --flavor prod
```

Pour utiliser un backend sur ta machine par USB, inverse le port pour que l'appareil puisse atteindre
`localhost:5033` :

```sh
bun run adb:reverse       # adb reverse tcp:5033 tcp:5033
bun run install:dev:usb   # adb:reverse, then install:dev
```

Pour installer un build de dev avec une URL de backend personnalisée :

```sh
BACKEND_BASE_URL=https://example.test bun run install:dev:url
```

## Régénérer les icônes de l'application

`flutter_launcher_icons` génère les icônes de lancement Android et iOS à partir de
`assets/app_icon.png`. Les paramètres sont dans `pubspec.yaml`. Après avoir changé l'image, exécute :

```sh
bun run icons   # dart run flutter_launcher_icons
```

Le workflow de release régénère les icônes à chaque build.

## Publier une release

Release Drafter tient un brouillon de release à jour à partir des pull requests fusionnées. Pour faire
une release, publie le brouillon. La publication démarre deux workflows :

- **`build-and-release.yml`** compile les applications et les joint à la release.
- **`sync-version-on-release.yml`** compare le tag, sans son `v`, à `application.properties`. S'ils
  diffèrent, il met à jour `application.properties` et la version dans `pubspec.yaml`, en gardant le
  numéro de build, puis fusionne en squash une pull request `release-sync/<version>` dans `main`.

`version-bump.yml` est une alternative manuelle. Tu choisis patch, minor, major ou une version
personnalisée. Il commite la nouvelle version dans `pubspec.yaml`, pousse un tag `v<version>` et crée la
release.

### Ce que produit le workflow de build

| Fichier | Compilé à partir de |
| --- | --- |
| `schuly-<tag>.apk` | `flutter build apk --release --flavor prod` |
| `schuly-<tag>.aab` | `flutter build appbundle --release --flavor prod` |
| `schuly-<tag>.apk.sha256` | `sha256sum` de l'APK. Le programme de mise à jour intégré à l'application vérifie le téléchargement par rapport à ce fichier. |
| `schuly-<tag>.ipa` | `flutter build ios --release --no-codesign`, puis une archive `xcodebuild` non signée |

Le workflow définit le nom de build sur le tag et le numéro de build sur le numéro de l'exécution. Tu
peux aussi le démarrer à la main avec `workflow_dispatch`, mais il ne garde alors les fichiers que comme
artefacts du workflow. Il ne les joint à une release que quand une release publiée le démarre.

### Configuration du workflow

| Nom | Type | Rôle |
| --- | --- | --- |
| `KEYSTORE_BASE64` | Secret | Le keystore de release Android. Sans lui, le workflow génère un nouveau keystore pour cette exécution. |
| `KEYSTORE_PASSWORD`, `KEY_PASSWORD` | Secret | Mots de passe du keystore et de la clé. |
| `BACKEND_BASE_URL` | Variable | URL du backend compilée dans l'application. Vaut par défaut `https://api.schuly.dev`. |
| `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_SENDER_ID`, `FIREBASE_PROJECT_ID` | Variable | Projet Firebase pour les notifications push. |
| `SENTRY_URL` | Variable | Transmise comme `SENTRY_DSN`. `pubspec.yaml` n'a pas de package Sentry, donc l'application ne l'utilise pas. |
