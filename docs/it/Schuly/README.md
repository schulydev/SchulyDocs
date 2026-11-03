# Documentazione di Schuly

Usa queste pagine per eseguire, compilare e modificare l'app mobile di Schuly. Schuly è un'app Flutter per Android
e iOS che mostra note, esami, agenda e assenze dei sistemi scolastici. L'interfaccia usa
[Forui](https://forui.dev).

L'app funziona in due modalità:

- **Modalità account:** usa un account Schuly su [SchulyServer](https://github.com/schulydev/SchulyServer).
- **Modalità privata** (detta anche modalità sicura): tiene le credenziali sul dispositivo e chiama endpoint proxy
  anonimi e senza stato.

## Avvio rapido

```sh
bun run clean   # flutter clean && flutter pub get
bun run dev     # run the dev flavor on a connected device or emulator
```

[Setup di sviluppo](setup/development.md) elenca i prerequisiti.

## Pagine

| Pagina | Contenuto |
| --- | --- |
| [Modalità dell'app](architecture-modes.md) | Modalità account e privata, dove risiedono i dati, il flusso di connessione |
| [Setup di sviluppo](setup/development.md) | Prerequisiti, task bun, flavor, backend locale, controlli di qualità |
| [Build e release](setup/build-and-release.md) | Build locali, installazione con adb, icone dell'app, il workflow di release |
| [Client API](api-client.md) | Come viene generato `lib/api/` e come rigenerarlo |
| [Come contribuire](contributing.md) | Le regole e i controlli di questo repository |
