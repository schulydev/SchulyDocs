# Build & release

Produzione di artefatti installabili per l'app Schuly. Tutti i comandi sono script
`package.json` eseguiti tramite bun - vedi
[Configurazione per lo sviluppo](development.md) per i prerequisiti e una panoramica
dei flavor.

## APK di release

```sh
bun run build:apk:dev    # flutter build apk --flavor dev  --release
bun run build:apk:prod   # flutter build apk --flavor prod --release
```

| Flavor | Application ID | Nome visualizzato |
| --- | --- | --- |
| `dev` | `com.schuly.app.dev` (suffisso di versione `-DEV`) | **Schuly DEV** |
| `prod` | `com.schuly.app` | **Schuly** |

I due flavor si installano fianco a fianco, quindi una build dev non sovrascrive mai
una build prod sullo stesso dispositivo.

### Puntare una build dev verso un backend personalizzato

```sh
BACKEND_BASE_URL=https://example.test bun run build:apk:dev:url
```

`build:apk:dev:url` inoltra `$BACKEND_BASE_URL` tramite
`--dart-define=BACKEND_BASE_URL`.

## Build iOS

```sh
bun run build:ios   # flutter build ios --flavor prod --no-codesign
```

Compila il flavor `prod` senza firma del codice (da firmare separatamente in Xcode o
nella tua pipeline di firma).

## Installazione via adb

Compila l'APK di release e la installa sul dispositivo attualmente connesso via adb:

```sh
bun run install:dev    # compila l'APK dev, poi flutter install --flavor dev
bun run install:prod   # compila l'APK prod, poi flutter install --flavor prod
```

Quando lavori con un backend ospitato localmente via USB, reindirizza prima la porta
del backend in modo che il dispositivo possa raggiungere `localhost:5033`:

```sh
bun run adb:reverse        # adb reverse tcp:5033 tcp:5033
bun run install:dev:usb    # adb:reverse + install:dev
```

Per installare una build dev puntata su un URL di backend personalizzato:

```sh
BACKEND_BASE_URL=https://example.test bun run install:dev:url
```

## Icone dell'app

L'icona del launcher viene generata da `assets/app_icon.png` tramite
`flutter_launcher_icons` (Android + iOS, configurato in `pubspec.yaml`). Dopo aver
modificato l'immagine sorgente:

```sh
bun run icons   # dart run flutter_launcher_icons
```

## Vedi anche

- [Configurazione per lo sviluppo](development.md) - versioni SDK, esecuzione
  dell'app.
- [Client API](../api-client.md) - rigenerare il client generato prima di una build.
