# Contribuisci

Tutto il codice di Schuly è su [GitHub](https://github.com/schulydev). Gli issue con l'etichetta `bug`
o `feature` sono un buon punto di partenza.

## Scegli un progetto

| Progetto | Stack | Inizia da qui |
|---|---|---|
| App mobile | Flutter | [Setup di sviluppo](/it/Schuly/setup/development) |
| Server e app web | ASP.NET Core, Angular | [Setup di sviluppo](/it/SchulyServer/setup/development) |
| Plugin | .NET | [Setup di sviluppo](/it/SchulyPlugins/setup/development) |
| Contratto dei plugin | .NET, NuGet | [Setup di sviluppo](/it/SchulyPluginAbstractions/setup/development) |
| Sito web | Angular | [Setup di sviluppo](/it/SchulyWebsite/setup/development) |
| Questa documentazione | VitePress | [Modificare questa documentazione](/editing-these-docs) |

## Apporta una modifica

Ogni repository usa lo stesso flusso:

1. Apri un issue con un'etichetta.
2. Crea un branch da `main`, chiamato `feature/<issue#>_PascalCase` o `fix/<issue#>_PascalCase`.
3. Fai il commit con un oggetto breve all'imperativo, come `Add agenda filter`.
4. Apri una pull request con un'etichetta. Il suo corpo contiene un riepilogo e `Closes #<issue>`, senza piano di test.
5. Fai lo squash-merge della pull request ed elimina il branch.

Non fare commit direttamente su `main` e non aggiungere attribuzioni all'IA a commit, pull request o issue.

La pagina **Come contribuire** di ogni progetto elenca le sue regole.

## Etichette

| Etichetta | Da usare per |
|---|---|
| `bug` | Qualcosa che non funziona |
| `enhancement` | Un miglioramento di un comportamento esistente |
| `feature` | Nuove funzionalità |
| `refactor` | Modifiche interne che non cambiano il comportamento |
| `CI/CD` | Modifiche a build, release e workflow |
| `dependencies` | Aggiornamenti delle dipendenze |
| `documentation` | Modifiche solo alla documentazione |
