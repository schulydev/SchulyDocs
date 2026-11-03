# Contribuer

Ces règles s'appliquent à ce dépôt. Pour les branches, les commits, les pull requests et les labels, suis le
[processus partagé](/fr/contribute/).

## Labels

Ce dépôt ajoute ces labels aux labels partagés :

| Label | À utiliser pour |
|---|---|
| `new-plugin` | Une proposition ou une base de code pour un nouveau plugin |
| `plugin: example`, `plugin: schulware`, `plugin: odaorg`, `plugin: microsoft` | Des changements de ce plugin |

## Règles

- Utilise un générateur en ligne de commande quand il en existe un : `gh issue create`, `gh pr create`,
  `dotnet ef migrations add`, `kiota`.
- Incrémente `<Version>` dans le csproj du plugin quand tu changes le comportement du plugin. L'index publié
  lit `Version`, `Description` et `Authors` dans chaque csproj, et les serveurs comparent la version pour
  décider s'ils font la mise à jour.

## Pages associées

- [Ajouter un plugin](adding-a-plugin.md)
- [Migrations EF Core](migrations.md)
- [Client Kiota](setup/kiota-client.md)
- [Distribution](setup/distribution.md) : comment les fusions dans `main` sont livrées
