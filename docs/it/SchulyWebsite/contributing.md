# Come contribuire

Usa questa pagina per le regole e i controlli specifici del sito web. Per issue, branch, pull request
ed etichette, segui il [flusso di lavoro condiviso](/it/contribute/).

## Regole

- Usa Bun per tutto, non npm, npx o node.
- Segui le [convenzioni di codice Angular 20](architecture.md#angular-20-coding-conventions).
- Quando aggiungi una lingua o una pagina, aggiorna `scripts/postbuild.ts`. Vedi
  [Route e lingue](architecture.md#route-e-lingue).

## Controlli

La CI li esegue sui push e sulle pull request verso `main`. Eseguili prima di aprire una pull request:

```sh
bun install --frozen-lockfile
bun run build
```

Esegui anche i test unitari. La CI non li esegue.

```sh
bun run test
```
