# Release

Il versioning è guidato da **`application.properties`** (l'unica fonte di verità,
un file XML con un elemento `<version>`).

## Come viene creata una release

1. Pubblica una Release GitHub con un tag (ad es. `v0.1.0`).
2. Il workflow `sync-version-on-release.yml` viene eseguito su `release: published`
   e, se la versione del tag differisce da quella nel file, aggiorna entrambi:
   - il `<version>` in `application.properties`, e
   - il `"version"` di primo livello in `package.json`

   poi apre una PR `release-sync/<version>` verso `main` e la unisce automaticamente.

Se la versione nel file corrisponde già al tag, il workflow non fa nulla.

## Vedi anche

- [Distribuzione](deployment.md)
- [Contributing](../contributing.md)
