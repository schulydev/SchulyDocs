# Documentazione Schuly

Schuly è un'app mobile Flutter per accedere ai dati scolastici (voti, esami, agenda,
assenze) dei sistemi basati su Schulnetz. Funziona in due modalità - una
**modalità account**, basata su
[SchulyBackend](https://github.com/schulydev/SchulyBackend) tramite OIDC, e una
**modalità privata / sicura**, che mantiene le credenziali sul dispositivo e comunica
solo con endpoint proxy anonimi e senza stato. L'interfaccia è realizzata con
[Forui](https://forui.dev).

## Indice

| Documento | Contenuto |
| --- | --- |
| [Architettura: modalità dell'app](architecture-modes.md) | Modalità account vs privata, dove risiedono i dati, il flusso di connessione |
| [Configurazione per lo sviluppo](setup/development.md) | SDK Flutter, task runner bun, esecuzione dei flavor dev/prod, analyze/test/format |
| [Build & release](setup/build-and-release.md) | APK di release, build iOS, installazione via adb, rigenerazione dell'icona dell'app |
| [Client API](api-client.md) | Come viene generato `lib/api/` e come rigenerarlo |
| [Contribuire](contributing.md) | Il workflow obbligatorio issue → branch → PR e la tassonomia delle label |

## Avvio rapido

```sh
bun run clean   # flutter clean && flutter pub get
bun run dev     # esegue il flavor dev su un dispositivo/emulatore connesso
```

Per i prerequisiti vedi [Configurazione per lo sviluppo](setup/development.md).
