# Configuration de développement

Mise en place de l'environnement local pour travailler sur l'app Flutter Schuly.

## Prérequis

| Outil | Version | Remarques |
| --- | --- | --- |
| SDK Flutter | `3.44.x` | Fixé dans la CI (`subosito/flutter-action`). Embarque le SDK Dart correspondant. |
| SDK Dart | `^3.10.0` | Fourni avec Flutter `3.44.x` ; c'est aussi la contrainte `environment.sdk` dans `pubspec.yaml`. |
| bun | `latest` | Utilisé uniquement comme task runner pour les scripts `package.json`. N'installe **pas** de toolchain Node - il ne fait que dispatcher des commandes. |
| Android SDK / Xcode | - | Toolchain mobile Flutter standard pour builder/exécuter sur Android ou iOS. |

Vérifie la toolchain Flutter avec :

```sh
flutter doctor
```

## Tâches (à privilégier)

Tous les workflows courants sont encapsulés dans des scripts `package.json`, afin
d'être invoqués de la même façon quel que soit le shell. Préfère toujours
`bun run <script>` à la commande brute.

```sh
bun run dev        # flutter run --flavor dev
bun run prod       # flutter run --flavor prod
bun run analyze    # flutter analyze
bun run test       # flutter test
bun run format     # dart format lib
bun run clean      # flutter clean && flutter pub get
```

## Récupérer les dépendances

```sh
bun run clean
```

Ceci exécute `flutter clean && flutter pub get`. L'app dépend du package API généré
localement dans `lib/api/` (référencé via `path:` dans `pubspec.yaml`) - voir
[Client API](../api-client.md) si tu as besoin de le régénérer.

## Exécuter l'app

Démarre un émulateur ou connecte un appareil, puis exécute l'un des flavors :

```sh
bun run dev     # flavor de développement
bun run prod    # flavor de production
```

### Flavors

L'app définit une dimension de flavor `environment` (Android : `productFlavors` dans
`android/app/build.gradle.kts`) :

| Flavor | ID d'application | Nom affiché |
| --- | --- | --- |
| `dev` | `com.schuly.app.dev` (suffixe `.dev`, suffixe de version `-DEV`) | **Schuly DEV** |
| `prod` | `com.schuly.app` | **Schuly** |

Comme les ID diffèrent, les builds dev et prod s'installent côte à côte sur le même
appareil. Utilise `dev` pour le travail quotidien et `prod` pour valider le
comportement de release.

## Vérifications qualité avant de pousser

```sh
bun run analyze   # analyse statique
bun run test      # tests unitaires/widget
bun run format    # formate automatiquement lib/
```

Le client généré dans `lib/api/**` est exclu de `flutter analyze` (voir
`analysis_options.yaml`).

## Voir aussi

- [Build & release](build-and-release.md) - APK de release, iOS, installation via
  adb, icônes.
- [Contribuer](../contributing.md) - workflow branche/PR.
