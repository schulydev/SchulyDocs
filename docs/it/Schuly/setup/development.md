# Setup di sviluppo

Usa questa pagina per preparare il tuo computer ed eseguire l'app Flutter di Schuly.

## Prerequisiti

| Strumento | Versione | Note |
| --- | --- | --- |
| Flutter SDK | `3.44.x` | Fissato nella CI con `subosito/flutter-action`. Include l'SDK Dart corrispondente. |
| Dart SDK | `^3.10.0` | Incluso in Flutter. È anche il vincolo `environment.sdk` in `pubspec.yaml`. |
| bun | `latest` | Esegue gli script di `package.json`. Non aggiunge una toolchain Node. |
| Android SDK o Xcode | - | La toolchain Flutter standard per Android o iOS. La CI compila Android con Java 17. |

Controlla la toolchain Flutter:

```sh
flutter doctor
```

## Installa le dipendenze

```sh
bun run clean   # flutter clean && flutter pub get
```

L'app dipende dal pacchetto API generato in `lib/api/`. Per rigenerarlo, vedi
[Client API](../api-client.md).

## Esegui l'app

Avvia un emulatore o collega un dispositivo, poi esegui un flavor:

```sh
bun run dev    # flutter run --flavor dev
bun run prod   # flutter run --flavor prod, with BACKEND_BASE_URL=https://api.schuly.dev
```

Usa `dev` per il lavoro quotidiano e `prod` per controllare il comportamento di release.

## Flavor

La dimensione di flavor `environment` è impostata in `productFlavors` in `android/app/build.gradle.kts`:

| Flavor | ID dell'applicazione | Nome visualizzato |
| --- | --- | --- |
| `dev` | `com.schuly.app.dev` (suffisso del nome di versione `-DEV`) | **Schuly DEV** |
| `prod` | `com.schuly.app` | **Schuly** |

Gli ID sono diversi, quindi entrambe le build si installano una accanto all'altra sullo stesso dispositivo.

## Collegati a un backend locale

La define `BACKEND_BASE_URL` imposta l'URL del backend in fase di build. Senza di essa, l'app usa
`http://localhost:5033`, quindi `bun run dev` si aspetta un backend su quella porta. Puoi anche puntare l'app
a un altro server durante l'onboarding.

Per raggiungere da un dispositivo via USB un backend sul tuo computer, inverti la porta:

```sh
bun run adb:reverse   # adb reverse tcp:5033 tcp:5033
```

Per creare una build per un altro indirizzo, come un computer nella tua LAN, vedi
[Punta una build dev a un backend personalizzato](build-and-release.md#punta-una-build-dev-a-un-backend-personalizzato).

## Attiva le notifiche push

Gli script di esecuzione e di build passano queste variabili d'ambiente come valori `--dart-define`:
`FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_SENDER_ID` e `FIREBASE_PROJECT_ID`. Il repository non contiene
né `google-services.json` né `GoogleService-Info.plist`. Se manca un valore, l'app funziona senza
notifiche push.

## Controlli di qualità

```sh
bun run analyze   # flutter analyze
bun run test      # flutter test
bun run format    # dart format lib
```

`analysis_options.yaml` esclude il client generato in `lib/api/**` da `flutter analyze`.
