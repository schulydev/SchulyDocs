# Come contribuire

Usa questa pagina per le regole e i controlli specifici dell'app mobile. Per issue, branch, pull
request ed etichette, segui il [flusso di lavoro condiviso](/it/contribute/).

## Regole

- Esegui i task con `bun run <script>` invece del comando diretto, e non usare npm, npx o node.
- Usa un generatore da CLI quando esiste, come `gh issue create` o `gh pr create`.

## Controlli prima di aprire una pull request

```sh
bun run analyze
bun run test
bun run format
```

La CI esegue `flutter analyze` e `flutter test` su ogni pull request. Se modifichi `android/**` o
`pubspec.yaml`, la CI compila anche un APK di debug del flavor dev.

Vedi [Setup di sviluppo](setup/development.md) per i dettagli.
