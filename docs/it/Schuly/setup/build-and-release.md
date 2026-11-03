# Build e release

Usa questa pagina per creare app installabili sul tuo computer e per pubblicare una release. I comandi locali sono
script di `package.json`. Vedi [Setup di sviluppo](development.md) per i prerequisiti e i flavor.

## Crea gli APK di release

```sh
bun run build:apk:dev    # flutter build apk --flavor dev --release
bun run build:apk:prod   # flutter build apk --flavor prod --release
```

Gli script `prod` impostano `BACKEND_BASE_URL=https://api.schuly.dev`. Tutti gli script di build passano i valori
Firebase elencati in [Setup di sviluppo](development.md#attiva-le-notifiche-push).

Le build di release usano la chiave di firma di `android/key.properties`. Senza quel file, usano la
chiave di debug.

### Punta una build dev a un backend personalizzato

```sh
BACKEND_BASE_URL=https://example.test bun run build:apk:dev:url
```

`build:apk:dev:url` passa `$BACKEND_BASE_URL` tramite `--dart-define=BACKEND_BASE_URL`.

## Crea la build per iOS

```sh
bun run build:ios   # flutter build ios --flavor prod --no-codesign
```

Questo crea il flavor `prod` senza firma del codice. Firmalo separatamente, in Xcode o nella tua pipeline
di firma.

## Installa tramite adb

Questi script creano un APK di release e lo installano sulla destinazione adb collegata:

```sh
bun run install:dev    # build the dev APK, then flutter install --flavor dev
bun run install:prod   # build the prod APK, then flutter install --flavor prod
```

Per usare via USB un backend sul tuo computer, inverti la porta così il dispositivo può raggiungere `localhost:5033`:

```sh
bun run adb:reverse       # adb reverse tcp:5033 tcp:5033
bun run install:dev:usb   # adb:reverse, then install:dev
```

Per installare una build dev con un URL del backend personalizzato:

```sh
BACKEND_BASE_URL=https://example.test bun run install:dev:url
```

## Rigenera le icone dell'app

`flutter_launcher_icons` genera le icone di avvio per Android e iOS da `assets/app_icon.png`. Le
impostazioni sono in `pubspec.yaml`. Dopo aver cambiato l'immagine, esegui:

```sh
bun run icons   # dart run flutter_launcher_icons
```

Il workflow di release rigenera le icone a ogni build.

## Pubblica una release

Release Drafter tiene aggiornata una bozza di release a partire dalle pull request unite. Per fare una release, pubblica la
bozza. La pubblicazione avvia due workflow:

- **`build-and-release.yml`** crea le app e le allega alla release.
- **`sync-version-on-release.yml`** confronta il tag, senza la sua `v`, con `application.properties`. Se
  differiscono, aggiorna `application.properties` e la versione in `pubspec.yaml`, mantenendo il numero di
  build, poi fa lo squash-merge di una pull request `release-sync/<version>` in `main`.

`version-bump.yml` è un'alternativa manuale. Scegli patch, minor, major o una versione personalizzata. Fa il
commit della nuova versione in `pubspec.yaml`, fa il push di un tag `v<version>` e crea la release.

### Cosa produce il workflow di build

| Asset | Creato da |
| --- | --- |
| `schuly-<tag>.apk` | `flutter build apk --release --flavor prod` |
| `schuly-<tag>.aab` | `flutter build appbundle --release --flavor prod` |
| `schuly-<tag>.apk.sha256` | `sha256sum` dell'APK. L'aggiornamento integrato nell'app controlla il download con questo valore. |
| `schuly-<tag>.ipa` | `flutter build ios --release --no-codesign`, poi un archivio `xcodebuild` non firmato |

Il workflow imposta il nome della build sul tag e il numero di build sul numero di esecuzione. Puoi anche avviarlo
a mano con `workflow_dispatch`, ma in quel caso conserva i file solo come artefatti del workflow. Li allega
a una release solo quando lo avvia una release pubblicata.

### Configurazione del workflow

| Nome | Tipo | Scopo |
| --- | --- | --- |
| `KEYSTORE_BASE64` | Segreto | Il keystore di release Android. Senza di esso, il workflow genera un nuovo keystore per quell'esecuzione. |
| `KEYSTORE_PASSWORD`, `KEY_PASSWORD` | Segreto | Password del keystore e della chiave. |
| `BACKEND_BASE_URL` | Variabile | URL del backend compilato nell'app. Il valore predefinito è `https://api.schuly.dev`. |
| `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_SENDER_ID`, `FIREBASE_PROJECT_ID` | Variabile | Progetto Firebase per le notifiche push. |
| `SENTRY_URL` | Variabile | Passata come `SENTRY_DSN`. `pubspec.yaml` non contiene un pacchetto Sentry, quindi l'app non la usa. |
