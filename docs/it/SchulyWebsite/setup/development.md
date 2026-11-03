# Setup di sviluppo

Usa questa pagina per installare, eseguire, compilare e testare il sito sul tuo computer.

## Prerequisiti

Installa Bun `1.2.21` o più recente. È l'unico gestore di pacchetti di questo progetto, e non esiste un
`package-lock.json`.

Il progetto usa il formato di testo `bun.lock`, che Bun 1.1.x non può leggere. `package.json` fissa
`bun@1.2.21` in `packageManager`, e `cli.packageManager` in `angular.json` seleziona Bun per
Angular CLI.

## Comandi

```sh
bun install       # install dependencies
bun start         # ng serve on http://localhost:4200
bun run watch     # ng build --watch --configuration development
bun run build     # ng build (production), then scripts/postbuild.ts
bun run test      # ng test (Karma and Jasmine)
```

La build di produzione scrive in `dist/SchulyWebsite/browser`. Vedi [Deployment](deployment.md) per come
viene servito questo output.
