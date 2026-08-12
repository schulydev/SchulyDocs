# Entwicklungsumgebung

Lokale Umgebung für die Arbeit an der Schuly-Flutter-App einrichten.

## Voraussetzungen

| Tool | Version | Hinweise |
| --- | --- | --- |
| Flutter SDK | `3.44.x` | In der CI gepinnt (`subosito/flutter-action`). Bringt das passende Dart SDK mit. |
| Dart SDK | `^3.10.0` | Kommt mit Flutter `3.44.x`; auch die `environment.sdk`-Constraint in `pubspec.yaml`. |
| bun | `latest` | Wird ausschliesslich als Task-Runner für die `package.json`-Skripte verwendet. Zieht **keine** Node-Toolchain nach sich - dispatcht nur Befehle. |
| Android SDK / Xcode | - | Standard-Flutter-Toolchain für den Build/Betrieb auf Android bzw. iOS. |

Die Flutter-Toolchain prüfen mit:

```sh
flutter doctor
```

## Tasks (bevorzugt)

Alle gängigen Workflows sind als `package.json`-Skripte gekapselt, damit sie in jeder
Shell gleich aufgerufen werden. Immer `bun run <script>` dem rohen Befehl vorziehen.

```sh
bun run dev        # flutter run --flavor dev
bun run prod       # flutter run --flavor prod
bun run analyze    # flutter analyze
bun run test       # flutter test
bun run format     # dart format lib
bun run clean      # flutter clean && flutter pub get
```

## Abhängigkeiten holen

```sh
bun run clean
```

Das führt `flutter clean && flutter pub get` aus. Die App hängt vom lokalen
generierten API-Package unter `lib/api/` ab (referenziert über `path:` in
`pubspec.yaml`) - siehe [API-Client](../api-client.md), falls du es neu generieren
musst.

## Die App ausführen

Emulator starten oder Gerät verbinden, dann einen der Flavors ausführen:

```sh
bun run dev     # Entwicklungs-Flavor
bun run prod    # Produktions-Flavor
```

### Flavors

Die App definiert eine `environment`-Flavor-Dimension (Android: `productFlavors` in
`android/app/build.gradle.kts`):

| Flavor | Application-ID | Anzeigename |
| --- | --- | --- |
| `dev` | `com.schuly.app.dev` (Suffix `.dev`, Versionsnamen-Suffix `-DEV`) | **Schuly DEV** |
| `prod` | `com.schuly.app` | **Schuly** |

Da sich die IDs unterscheiden, werden Dev- und Prod-Build nebeneinander auf demselben
Gerät installiert. `dev` für die alltägliche Arbeit verwenden, `prod` um das
Release-Verhalten zu validieren.

## Qualitätschecks vor dem Push

```sh
bun run analyze   # statische Analyse
bun run test      # Unit-/Widget-Tests
bun run format    # lib/ automatisch formatieren
```

Der generierte Client unter `lib/api/**` ist von `flutter analyze` ausgeschlossen
(siehe `analysis_options.yaml`).

## Siehe auch

- [Build & Release](build-and-release.md) - Release-APKs, iOS, adb-Installation, Icons.
- [Contributing](../contributing.md) - Branch-/PR-Workflow.
