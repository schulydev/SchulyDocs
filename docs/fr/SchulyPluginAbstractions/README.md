# Schuly.Plugin.Abstractions - Documentation

`Schuly.Plugin.Abstractions` est le **contrat de plugin stable** du
[backend Schuly](https://github.com/schulydev/SchulyBackend), publié sur NuGet.org sous le nom
[`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions). Les
auteurs de plugins référencent le package et implémentent ses interfaces ; l'hôte de plugins du
backend découvre l'implémentation et l'exécute. Ce dépôt est volontairement **petit et
stable** - le contrat change rarement et obéit à un semver strict, afin qu'un plugin construit
pour un hôte ne casse pas sur un autre.

## Sommaire

- [Référence du contrat](contract.md) - chaque interface et chaque record, avec les signatures
  réelles et l'endroit où chaque membre s'inscrit dans le cycle de vie du plugin.
- [Configuration](setup/) - développement local et publication :
  - [Développement](setup/development.md) - prérequis, build, pack local à blanc.
  - [Publication](setup/publishing.md) - le flux de release NuGet et les métadonnées du
    package.
- [Versionnement](versioning.md) - règles semver strictes et labels qui pilotent les releases.
- [Contribuer](contributing.md) - le workflow imposé issue → branche → PR et les règles de
  dépendances propres à ce dépôt.
