# Schuly.Plugin.Abstractions - Documentazione

`Schuly.Plugin.Abstractions` è il **contratto di plugin stabile** per il
[backend Schuly](https://github.com/schulydev/SchulyBackend), pubblicato su NuGet.org come
[`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions). Gli
autori dei plugin referenziano il pacchetto e implementano le sue interfacce; l'host di plugin
del backend individua l'implementazione e la esegue. Questo repository è volutamente
**piccolo e stabile** - il contratto cambia raramente ed è governato da un semver rigoroso,
così i plugin costruiti per un host non si rompono su un altro.

## Indice

- [Riferimento del contratto](contract.md) - ogni interfaccia e ogni record, con le firme
  reali e la posizione di ciascun membro nel ciclo di vita del plugin.
- [Setup](setup/) - sviluppo locale e pubblicazione:
  - [Sviluppo](setup/development.md) - prerequisiti, build, pack dry-run locale.
  - [Pubblicazione](setup/publishing.md) - il flusso di release NuGet e i metadati del
    pacchetto.
- [Versionamento](versioning.md) - regole semver rigorose e le label che guidano le release.
- [Contributing](contributing.md) - il workflow obbligatorio issue → branch → PR e le regole
  sulle dipendenze di questo repository.
