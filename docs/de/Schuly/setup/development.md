# Entwicklungsumgebung

Nutze diese Seite, um deinen Rechner einzurichten und die Schuly-Flutter-App auszuführen.

## Voraussetzungen

| Tool | Version | Hinweise |
| --- | --- | --- |
| Flutter SDK | `3.44.x` | In CI mit `subosito/flutter-action` festgelegt. Enthält das passende Dart SDK. |
| Dart SDK | `^3.10.0` | Kommt mit Flutter. Auch die `environment.sdk`-Einschränkung in `pubspec.yaml`. |
| bun | `latest` | Führt die `package.json`-Skripte aus. Es fügt keine Node-Toolchain hinzu. |
| Android SDK oder Xcode | - | Die normale Flutter-Toolchain für Android oder iOS. CI baut Android mit Java 17. |

Prüfe die Flutter-Toolchain:

```sh
flutter doctor
```

## Abhängigkeiten installieren

```sh
bun run clean   # flutter clean && flutter pub get
```

Die App hängt vom generierten API-Package in `lib/api/` ab. Wie du es neu generierst, steht unter
[API-Client](../api-client.md).

## App ausführen

Starte einen Emulator oder verbinde ein Gerät und führe dann einen Flavor aus:

```sh
bun run dev    # flutter run --flavor dev
bun run prod   # flutter run --flavor prod, with BACKEND_BASE_URL=https://api.schuly.dev
```

Nutze `dev` für die tägliche Arbeit und `prod`, um das Release-Verhalten zu prüfen.

## Flavors

Die Flavor-Dimension `environment` ist in `productFlavors` in `android/app/build.gradle.kts` gesetzt:

| Flavor | Application ID | Anzeigename |
| --- | --- | --- |
| `dev` | `com.schuly.app.dev` (Versionsnamen-Suffix `-DEV`) | **Schuly DEV** |
| `prod` | `com.schuly.app` | **Schuly** |

Die IDs unterscheiden sich, deshalb lassen sich beide Builds nebeneinander auf einem Gerät installieren.

## Mit einem lokalen Backend verbinden

Das Define `BACKEND_BASE_URL` setzt die Backend-URL beim Build. Ohne es nutzt die App
`http://localhost:5033`. `bun run dev` erwartet deshalb ein Backend auf diesem Port. Du kannst die App
auch beim Onboarding auf einen anderen Server ausrichten.

Um von einem Gerät über USB ein Backend auf deinem Rechner zu erreichen, leite den Port um:

```sh
bun run adb:reverse   # adb reverse tcp:5033 tcp:5033
```

Um für eine andere Adresse zu bauen, zum Beispiel einen Rechner in deinem LAN, siehe
[Dev-Build auf ein eigenes Backend ausrichten](build-and-release.md#dev-build-auf-ein-eigenes-backend-ausrichten).

## Push-Benachrichtigungen aktivieren

Die Run- und Build-Skripte übergeben diese Umgebungsvariablen als `--dart-define`-Werte:
`FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_SENDER_ID` und `FIREBASE_PROJECT_ID`. Das Repo enthält
kein `google-services.json` und kein `GoogleService-Info.plist`. Fehlt ein Wert, läuft die App ohne
Push-Benachrichtigungen.

## Qualitätsprüfungen

```sh
bun run analyze   # flutter analyze
bun run test      # flutter test
bun run format    # dart format lib
```

`analysis_options.yaml` schliesst den generierten Client in `lib/api/**` von `flutter analyze` aus.
