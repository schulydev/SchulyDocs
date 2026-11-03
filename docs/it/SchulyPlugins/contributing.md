# Come contribuire

Queste regole valgono per questo repository. Per branch, commit, pull request ed etichette, segui il
[flusso di lavoro condiviso](/it/contribute/).

## Etichette

Questo repository aggiunge queste etichette a quelle condivise:

| Etichetta | Da usare per |
|---|---|
| `new-plugin` | Una proposta o lo scaffolding di un nuovo plugin |
| `plugin: example`, `plugin: schulware`, `plugin: odaorg`, `plugin: microsoft` | Modifiche a quel plugin |

## Regole

- Usa un generatore da CLI dove esiste: `gh issue create`, `gh pr create`,
  `dotnet ef migrations add`, `kiota`.
- Aumenta `<Version>` nel csproj del plugin quando cambi il comportamento del plugin. L'indice pubblicato
  legge `Version`, `Description` e `Authors` da ogni csproj, e i server confrontano la versione per
  decidere se aggiornare.

## Pagine correlate

- [Aggiungi un plugin](adding-a-plugin.md)
- [Migrazioni EF Core](migrations.md)
- [Client Kiota](setup/kiota-client.md)
- [Distribuzione](setup/distribution.md): come vengono rilasciati i merge in `main`
