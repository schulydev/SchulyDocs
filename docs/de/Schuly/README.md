# Schuly-Dokumentation

Schuly ist eine Flutter-App für den mobilen Zugriff auf Schuldaten (Noten, Prüfungen,
Stundenplan, Absenzen) von Schulnetz-basierten Systemen. Sie läuft in zwei Modi - einem
**Account-Modus**, der über [SchulyBackend](https://github.com/schulydev/SchulyBackend)
per OIDC läuft, und einem **privaten / sicheren Modus**, der die Zugangsdaten auf dem
Gerät behält und nur mit anonymen, zustandslosen Proxy-Endpunkten kommuniziert. Das UI
ist mit [Forui](https://forui.dev) gebaut.

## Inhalt

| Dokument | Inhalt |
| --- | --- |
| [Architektur: App-Modi](architecture-modes.md) | Account- vs. privater Modus, wo die Daten liegen, der Verbindungsablauf |
| [Entwicklungsumgebung](setup/development.md) | Flutter SDK, bun-Task-Runner, Ausführen der Dev-/Prod-Flavors, analyze/test/format |
| [Build & Release](setup/build-and-release.md) | Release-APKs, iOS-Build, adb-Installation, Neugenerierung des App-Icons |
| [API-Client](api-client.md) | Wie `lib/api/` generiert wird und wie man es neu generiert |
| [Contributing](contributing.md) | Der verbindliche Issue-→-Branch-→-PR-Workflow und die Label-Taxonomie |

## Schnellstart

```sh
bun run clean   # flutter clean && flutter pub get
bun run dev     # Dev-Flavor auf einem verbundenen Gerät/Emulator ausführen
```

Voraussetzungen findest du unter [Entwicklungsumgebung](setup/development.md).
