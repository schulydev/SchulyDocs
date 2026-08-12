# Build & Release

Installierbare Artefakte für die Schuly-App erzeugen. Alle Befehle sind
`package.json`-Skripte, die über bun laufen - Voraussetzungen und eine
Flavor-Übersicht findest du unter [Entwicklungsumgebung](development.md).

## Release-APKs

```sh
bun run build:apk:dev    # flutter build apk --flavor dev  --release
bun run build:apk:prod   # flutter build apk --flavor prod --release
```

| Flavor | Application-ID | Anzeigename |
| --- | --- | --- |
| `dev` | `com.schuly.app.dev` (Versionsnamen-Suffix `-DEV`) | **Schuly DEV** |
| `prod` | `com.schuly.app` | **Schuly** |

Die beiden Flavors werden nebeneinander installiert, sodass ein Dev-Build einen
Prod-Build auf demselben Gerät nie überschreibt.

### Einen Dev-Build auf ein eigenes Backend zeigen lassen

```sh
BACKEND_BASE_URL=https://example.test bun run build:apk:dev:url
```

`build:apk:dev:url` reicht `$BACKEND_BASE_URL` über `--dart-define=BACKEND_BASE_URL`
durch.

## iOS-Build

```sh
bun run build:ios   # flutter build ios --flavor prod --no-codesign
```

Baut den `prod`-Flavor ohne Code-Signierung (separat in Xcode bzw. deiner
Signing-Pipeline signieren).

## Installation über adb

Die Release-APK bauen und auf dem aktuell verbundenen adb-Zielgerät installieren:

```sh
bun run install:dev    # Dev-APK bauen, dann flutter install --flavor dev
bun run install:prod   # Prod-APK bauen, dann flutter install --flavor prod
```

Läuft es gegen ein lokal gehostetes Backend über USB, zuerst den Backend-Port
weiterleiten, damit das Gerät `localhost:5033` erreichen kann:

```sh
bun run adb:reverse        # adb reverse tcp:5033 tcp:5033
bun run install:dev:usb    # adb:reverse + install:dev
```

Um einen Dev-Build zu installieren, der auf eine eigene Backend-URL zeigt:

```sh
BACKEND_BASE_URL=https://example.test bun run install:dev:url
```

## App-Icons

Das Launcher-Icon wird aus `assets/app_icon.png` über `flutter_launcher_icons`
generiert (Android + iOS, konfiguriert in `pubspec.yaml`). Nach dem Ändern des
Quellbilds:

```sh
bun run icons   # dart run flutter_launcher_icons
```

## Siehe auch

- [Entwicklungsumgebung](development.md) - SDK-Versionen, App ausführen.
- [API-Client](../api-client.md) - den generierten Client vor einem Build neu
  generieren.
