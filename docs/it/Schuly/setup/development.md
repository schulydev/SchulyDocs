# Configurazione per lo sviluppo

Impostazione dell'ambiente locale per lavorare sull'app Flutter Schuly.

## Prerequisiti

| Strumento | Versione | Note |
| --- | --- | --- |
| SDK Flutter | `3.44.x` | Fissato nella CI (`subosito/flutter-action`). Include l'SDK Dart corrispondente. |
| SDK Dart | `^3.10.0` | Incluso con Flutter `3.44.x`; è anche il vincolo `environment.sdk` in `pubspec.yaml`. |
| bun | `latest` | Usato esclusivamente come task runner per gli script `package.json`. **Non** richiede una toolchain Node - si limita a smistare i comandi. |
| Android SDK / Xcode | - | Toolchain mobile Flutter standard per compilare/eseguire su Android o iOS. |

Verifica la toolchain Flutter con:

```sh
flutter doctor
```

## Task (preferiti)

Tutti i workflow più comuni sono racchiusi in script `package.json`, in modo da
essere invocati allo stesso modo da qualsiasi shell. Preferisci sempre
`bun run <script>` al comando grezzo.

```sh
bun run dev        # flutter run --flavor dev
bun run prod       # flutter run --flavor prod
bun run analyze    # flutter analyze
bun run test       # flutter test
bun run format     # dart format lib
bun run clean      # flutter clean && flutter pub get
```

## Ottenere le dipendenze

```sh
bun run clean
```

Questo esegue `flutter clean && flutter pub get`. L'app dipende dal package API
generato localmente in `lib/api/` (referenziato tramite `path:` in `pubspec.yaml`) -
vedi [Client API](../api-client.md) se hai bisogno di rigenerarlo.

## Eseguire l'app

Avvia un emulatore o collega un dispositivo, quindi esegui uno dei flavor:

```sh
bun run dev     # flavor di sviluppo
bun run prod    # flavor di produzione
```

### Flavor

L'app definisce una dimensione di flavor `environment` (Android: `productFlavors` in
`android/app/build.gradle.kts`):

| Flavor | Application ID | Nome visualizzato |
| --- | --- | --- |
| `dev` | `com.schuly.app.dev` (suffisso `.dev`, suffisso di versione `-DEV`) | **Schuly DEV** |
| `prod` | `com.schuly.app` | **Schuly** |

Poiché gli ID differiscono, le build dev e prod si installano fianco a fianco sullo
stesso dispositivo. Usa `dev` per il lavoro quotidiano e `prod` per validare il
comportamento di release.

## Controlli di qualità prima del push

```sh
bun run analyze   # analisi statica
bun run test      # test unitari/widget
bun run format    # formatta automaticamente lib/
```

Il client generato in `lib/api/**` è escluso da `flutter analyze` (vedi
`analysis_options.yaml`).

## Vedi anche

- [Build & release](build-and-release.md) - APK di release, iOS, installazione via
  adb, icone.
- [Contribuire](../contributing.md) - workflow branch/PR.
