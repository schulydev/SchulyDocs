# Schuly.Plugin.Abstractions

Utilise ces pages pour consulter le contrat de plugin ou pour le modifier.

`Schuly.Plugin.Abstractions` est le contrat de plugin du
[serveur Schuly](https://github.com/schulydev/SchulyServer), publié sur NuGet.org sous le nom
[`Schuly.Plugin.Abstractions`](https://www.nuget.org/packages/Schuly.Plugin.Abstractions). Tu références
le package et tu implémentes ses interfaces. L'hôte de plugins du serveur trouve et exécute ton
implémentation.

Ce dépôt reste petit et stable. Le contrat change rarement et suit un semver strict, donc les plugins
compilés pour un hôte ne cassent pas sur un autre.

| Page | À utiliser pour |
|---|---|
| [Référence du contrat](contract.md) | Consulter chaque interface et chaque record, avec les vraies signatures et la place de chaque membre dans le cycle de vie du plugin |
| [Développement](setup/development.md) | Configurer, compiler, tester et faire un essai de pack |
| [Publication](setup/publishing.md) | Voir le processus de release NuGet et les métadonnées du package |
| [Versionnement](versioning.md) | Choisir un incrément de version et voir les labels qui pilotent les releases |
| [Contribuer](contributing.md) | Suivre les règles de dépendances de ce dépôt |
