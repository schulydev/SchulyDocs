# Ambiente di sviluppo

## Prerequisiti

- **Bun `1.2.21+`** - è l'unico gestore di pacchetti usato per il progetto. Non c'è
  **né npm né `package-lock.json`**.
  - La versione è fissata tramite `packageManager` in `package.json` e
    `cli.packageManager` in `angular.json`.
  - La versione è importante: il progetto usa il formato di lockfile **testuale
    `bun.lock`**, che Bun 1.1.x non riesce a leggere. Usa 1.2.21 o una versione più
    recente.

## Installazione

```sh
bun install
```

## Avvio

```sh
bun start            # ng serve su http://localhost:4200
```

## Watch (build di sviluppo continuo)

```sh
bun run watch        # ng build --watch --configuration development
```

## Build di produzione

```sh
bun run build        # ng build (production) + scripts/postbuild.ts
```

Il build di produzione viene generato in `dist/SchulyWebsite/browser`. Vedi
[distribuzione](deployment.md) per sapere come viene servito questo output.

## Test

```sh
bun run test         # ng test (Karma + Jasmine)
```

## Vedi anche

- [Distribuzione](deployment.md)
- [Architettura e convenzioni di codice](../architecture.md)
- [Contributing](../contributing.md)
