# Schuly.Plugin.Abstractions

Usa queste pagine per consultare il contratto dei plugin o per modificarlo.

`Schuly.Plugin.Abstractions` è il contratto dei plugin per il
[server Schuly](https://github.com/schulydev/SchulyServer), pubblicato su NuGet.org come
[`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions). Fai riferimento
al pacchetto e implementi le sue interfacce. L'host dei plugin del server trova ed esegue la tua implementazione.

Questo repository resta piccolo e stabile. Il contratto cambia raramente e segue il semver in modo rigoroso, quindi i plugin compilati
per un host non si rompono su un altro.

| Pagina | Usala per |
|---|---|
| [Riferimento del contratto](contract.md) | Consultare ogni interfaccia e record, con le firme reali e il punto del ciclo di vita del plugin in cui si colloca ogni membro |
| [Sviluppo](setup/development.md) | Preparare l'ambiente, compilare, testare e provare un pack |
| [Pubblicazione](setup/publishing.md) | Vedere il flusso di release su NuGet e i metadati del pacchetto |
| [Versionamento](versioning.md) | Scegliere un aumento di versione e vedere le etichette che guidano le release |
| [Come contribuire](contributing.md) | Seguire le regole sulle dipendenze di questo repository |
