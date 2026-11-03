# Configuration de développement

Utilise cette page pour configurer ta machine et exécuter l'application Flutter Schuly.

## Prérequis

| Outil | Version | Remarques |
| --- | --- | --- |
| SDK Flutter | `3.44.x` | Épinglé dans la CI avec `subosito/flutter-action`. Inclut le SDK Dart correspondant. |
| SDK Dart | `^3.10.0` | Fourni avec Flutter. C'est aussi la contrainte `environment.sdk` dans `pubspec.yaml`. |
| bun | `latest` | Exécute les scripts de `package.json`. Il n'ajoute pas de chaîne d'outils Node. |
| SDK Android ou Xcode | - | La chaîne d'outils Flutter standard pour Android ou iOS. La CI compile Android avec Java 17. |

Vérifie la chaîne d'outils Flutter :

```sh
flutter doctor
```

## Installer les dépendances

```sh
bun run clean   # flutter clean && flutter pub get
```

L'application dépend du package API généré dans `lib/api/`. Pour le régénérer, voir
[Client API](../api-client.md).

## Exécuter l'application

Démarre un émulateur ou connecte un appareil, puis exécute un flavor :

```sh
bun run dev    # flutter run --flavor dev
bun run prod   # flutter run --flavor prod, with BACKEND_BASE_URL=https://api.schuly.dev
```

Utilise `dev` pour le travail quotidien et `prod` pour vérifier le comportement de release.

## Flavors

La dimension de flavor `environment` est définie dans `productFlavors` dans
`android/app/build.gradle.kts` :

| Flavor | ID d'application | Nom affiché |
| --- | --- | --- |
| `dev` | `com.schuly.app.dev` (suffixe de nom de version `-DEV`) | **Schuly DEV** |
| `prod` | `com.schuly.app` | **Schuly** |

Les ID diffèrent, donc les deux builds s'installent côte à côte sur un même appareil.

## Se connecter à un backend local

Le define `BACKEND_BASE_URL` définit l'URL du backend au moment du build. Sans lui, l'application utilise
`http://localhost:5033`, donc `bun run dev` attend un backend sur ce port. Tu peux aussi pointer
l'application vers un autre serveur pendant l'onboarding.

Pour atteindre un backend sur ta machine depuis un appareil par USB, inverse le port :

```sh
bun run adb:reverse   # adb reverse tcp:5033 tcp:5033
```

Pour compiler pour une autre adresse, comme une machine sur ton LAN, voir
[Pointer un build de dev vers un backend personnalisé](build-and-release.md#pointer-un-build-de-dev-vers-un-backend-personnalise).

## Activer les notifications push

Les scripts d'exécution et de build transmettent ces variables d'environnement comme valeurs
`--dart-define` : `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_SENDER_ID` et `FIREBASE_PROJECT_ID`. Le
dépôt ne contient ni `google-services.json` ni `GoogleService-Info.plist`. Si une valeur manque,
l'application fonctionne sans notifications push.

## Contrôles de qualité

```sh
bun run analyze   # flutter analyze
bun run test      # flutter test
bun run format    # dart format lib
```

`analysis_options.yaml` exclut le client généré dans `lib/api/**` de `flutter analyze`.
