# Schuly-Dokumentation

Nutze diese Seiten, um die Schuly-Mobile-App auszuführen, zu bauen und zu ändern. Schuly ist eine
Flutter-App für Android und iOS. Sie zeigt Noten, Prüfungen, Agenda und Absenzen aus Schulsystemen an.
Das UI nutzt [Forui](https://forui.dev).

Die App läuft in zwei Modi:

- **Account-Modus:** nutzt ein Schuly-Konto auf [SchulyServer](https://github.com/schulydev/SchulyServer).
- **Privater Modus** (auch sicherer Modus genannt): behält die Zugangsdaten auf dem Gerät und ruft
  anonyme, zustandslose Proxy-Endpunkte auf.

## Schnellstart

```sh
bun run clean   # flutter clean && flutter pub get
bun run dev     # run the dev flavor on a connected device or emulator
```

[Entwicklungsumgebung](setup/development.md) listet die Voraussetzungen auf.

## Seiten

| Seite | Inhalt |
| --- | --- |
| [App-Modi](architecture-modes.md) | Account- und privater Modus, wo die Daten liegen, der Verbindungsablauf |
| [Entwicklungsumgebung](setup/development.md) | Voraussetzungen, bun-Tasks, Flavors, lokales Backend, Qualitätsprüfungen |
| [Build & Release](setup/build-and-release.md) | Lokale Builds, adb-Installation, App-Icons, der Release-Workflow |
| [API-Client](api-client.md) | Wie `lib/api/` generiert wird und wie du es neu generierst |
| [Contributing](contributing.md) | Die Regeln und Prüfungen dieses Repos |
