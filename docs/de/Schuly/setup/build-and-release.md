# Build & Release

Nutze diese Seite, um installierbare Apps auf deinem Rechner zu bauen und ein Release zu veröffentlichen.
Lokale Befehle sind `package.json`-Skripte. Voraussetzungen und Flavors findest du unter
[Entwicklungsumgebung](development.md).

## Release-APKs bauen

```sh
bun run build:apk:dev    # flutter build apk --flavor dev --release
bun run build:apk:prod   # flutter build apk --flavor prod --release
```

Die `prod`-Skripte setzen `BACKEND_BASE_URL=https://api.schuly.dev`. Alle Build-Skripte übergeben die
Firebase-Werte, die unter [Entwicklungsumgebung](development.md#push-benachrichtigungen-aktivieren)
aufgelistet sind.

Release-Builds nutzen den Signaturschlüssel aus `android/key.properties`. Ohne diese Datei nutzen sie den
Debug-Schlüssel.

### Dev-Build auf ein eigenes Backend ausrichten

```sh
BACKEND_BASE_URL=https://example.test bun run build:apk:dev:url
```

`build:apk:dev:url` übergibt `$BACKEND_BASE_URL` über `--dart-define=BACKEND_BASE_URL`.

## Für iOS bauen

```sh
bun run build:ios   # flutter build ios --flavor prod --no-codesign
```

Das baut den `prod`-Flavor ohne Code-Signierung. Signiere ihn separat, in Xcode oder in deiner
Signatur-Pipeline.

## Über adb installieren

Diese Skripte bauen ein Release-APK und installieren es auf dem verbundenen adb-Ziel:

```sh
bun run install:dev    # build the dev APK, then flutter install --flavor dev
bun run install:prod   # build the prod APK, then flutter install --flavor prod
```

Um ein Backend auf deinem Rechner über USB zu nutzen, leite den Port um, damit das Gerät
`localhost:5033` erreicht:

```sh
bun run adb:reverse       # adb reverse tcp:5033 tcp:5033
bun run install:dev:usb   # adb:reverse, then install:dev
```

So installierst du einen Dev-Build mit eigener Backend-URL:

```sh
BACKEND_BASE_URL=https://example.test bun run install:dev:url
```

## App-Icons neu generieren

`flutter_launcher_icons` erzeugt die Launcher-Icons für Android und iOS aus `assets/app_icon.png`. Die
Einstellungen stehen in `pubspec.yaml`. Führe aus, nachdem du das Bild geändert hast:

```sh
bun run icons   # dart run flutter_launcher_icons
```

Der Release-Workflow generiert die Icons bei jedem Build neu.

## Release veröffentlichen

Release Drafter hält aus zusammengeführten Pull Requests einen Release-Entwurf aktuell. Veröffentliche
für ein Release diesen Entwurf. Das Veröffentlichen startet zwei Workflows:

- **`build-and-release.yml`** baut die Apps und hängt sie an das Release an.
- **`sync-version-on-release.yml`** vergleicht den Tag ohne sein `v` mit `application.properties`. Wenn
  sie sich unterscheiden, aktualisiert der Workflow `application.properties` und die Version in
  `pubspec.yaml`, behält die Build-Nummer bei und führt dann einen `release-sync/<version>`-Pull-Request
  per Squash-Merge in `main` zusammen.

`version-bump.yml` ist eine manuelle Alternative. Du wählst patch, minor, major oder eine eigene Version.
Der Workflow committet die neue Version in `pubspec.yaml`, pusht einen `v<version>`-Tag und erstellt das
Release.

### Was der Build-Workflow erzeugt

| Asset | Gebaut aus |
| --- | --- |
| `schuly-<tag>.apk` | `flutter build apk --release --flavor prod` |
| `schuly-<tag>.aab` | `flutter build appbundle --release --flavor prod` |
| `schuly-<tag>.apk.sha256` | `sha256sum` des APK. Der In-App-Updater prüft den Download damit. |
| `schuly-<tag>.ipa` | `flutter build ios --release --no-codesign`, dann ein unsigniertes `xcodebuild`-Archiv |

Der Workflow setzt den Build-Namen auf den Tag und die Build-Nummer auf die Run-Nummer. Du kannst ihn auch
von Hand mit `workflow_dispatch` starten. Dann behält er die Dateien aber nur als Workflow-Artefakte. An
ein Release hängt er sie nur an, wenn ein veröffentlichtes Release ihn startet.

### Workflow-Konfiguration

| Name | Art | Zweck |
| --- | --- | --- |
| `KEYSTORE_BASE64` | Secret | Der Android-Release-Keystore. Ohne ihn erzeugt der Workflow für diesen Run einen neuen Keystore. |
| `KEYSTORE_PASSWORD`, `KEY_PASSWORD` | Secret | Passwörter für Keystore und Schlüssel. |
| `BACKEND_BASE_URL` | Variable | In die App kompilierte Backend-URL. Standardwert ist `https://api.schuly.dev`. |
| `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_SENDER_ID`, `FIREBASE_PROJECT_ID` | Variable | Firebase-Projekt für Push-Benachrichtigungen. |
| `SENTRY_URL` | Variable | Wird als `SENTRY_DSN` übergeben. `pubspec.yaml` enthält kein Sentry-Package, die App nutzt den Wert also nicht. |
