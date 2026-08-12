# Distribuzione

Il sito è ospitato su **Cloudflare Pages**. La distribuzione passa attraverso
l'**integrazione GitHub di Cloudflare** (configurata nella dashboard di Cloudflare,
**non** tramite un workflow di GitHub Actions in questo repo).

## Deploy in produzione

- I push su **`main`** vengono distribuiti automaticamente da Cloudflare Pages.
- I **branch delle PR** ricevono automaticamente **deploy di anteprima** tramite la
  stessa integrazione.

## Impostazioni di build di Cloudflare

| Impostazione | Valore |
|---|---|
| Comando di build | `bun run build` |
| Directory di output | `dist/SchulyWebsite/browser` |
| Ambiente | `BUN_VERSION=1.2.21` |

Il build usa il builder `@angular/build:application` (vedi `angular.json`), che
produce la directory `dist/SchulyWebsite/browser` che Cloudflare è configurato per
servire. **Se modifichi `angular.json`** (nome del progetto, builder o impostazioni
di output), verifica che il percorso di output atteso da Cloudflare corrisponda
ancora.

## CI vs deploy

`.github/workflows/build.yml` è **indipendente** dalla distribuzione. Si limita a
eseguire `bun install --frozen-lockfile` + `bun run build` sui push e sulle PR verso
`main`, per verificare che il build funzioni - individuando così codice rotto prima
che Cloudflare tenti un deploy di anteprima. Non pubblica nulla di suo.

## Vedi anche

- [Ambiente di sviluppo](development.md)
- [Release](release.md)
