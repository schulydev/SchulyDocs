# Deployment

Usa questa pagina per vedere come il sito arriva su Cloudflare Pages e cosa controllare quando cambi la
build. L'integrazione GitHub di Cloudflare gestisce i deploy. È configurata nella dashboard di Cloudflare, non
in un workflow di GitHub Actions.

## Cosa viene distribuito

- I push su `main` vengono distribuiti in produzione.
- I branch delle pull request ricevono deploy di anteprima.

## Impostazioni di build di Cloudflare

| Impostazione | Valore |
| --- | --- |
| Comando di build | `bun run build` |
| Directory di output | `dist/SchulyWebsite/browser` |
| Ambiente | `BUN_VERSION=1.2.21` |

Il builder `@angular/build:application` in `angular.json` produce la directory di output. Se cambi il
nome del progetto, il builder o le impostazioni di output in `angular.json`, controlla che il percorso di output di Cloudflare
corrisponda ancora.

Il deploy usa anche `public/_redirects`, `public/_headers` e la Pages Function in
`functions/index.js`.

## CI

`.github/workflows/build.yml` non distribuisce nulla. Sui push e sulle pull request verso `main`, esegue
`bun install --frozen-lockfile` e `bun run build` con l'ultima versione di Bun, così intercetta il codice rotto
prima che Cloudflare provi un deploy di anteprima.
