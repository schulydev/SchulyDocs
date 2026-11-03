# Release

Usa questa pagina per creare una release. L'elemento `<version>` in `application.properties`, un file XML, è la
fonte di verità per la versione.

## Crea una release

1. Pubblica una release su GitHub con un tag come `v0.1.0`. Release Drafter tiene pronta una bozza dai push
   su `main`.
2. `sync-version-on-release.yml` viene eseguito e confronta il tag con `application.properties`. Se corrispondono,
   si ferma.
3. Se differiscono, aggiorna `<version>` in `application.properties` e la `version` di primo livello in
   `package.json`, poi fa lo squash-merge di una pull request `release-sync/<version>` in `main`.

Quel merge arriva in produzione tramite il [deploy normale](deployment.md).
