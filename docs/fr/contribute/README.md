# Contribuer

Tout le code de Schuly est sur [GitHub](https://github.com/schulydev). Les issues avec le label `bug`
ou `feature` sont un bon point de départ.

## Choisir un projet

| Projet | Technologies | Commence ici |
|---|---|---|
| Application mobile | Flutter | [Configuration de développement](/fr/Schuly/setup/development) |
| Serveur et application web | ASP.NET Core, Angular | [Configuration de développement](/fr/SchulyServer/setup/development) |
| Plugins | .NET | [Configuration de développement](/fr/SchulyPlugins/setup/development) |
| Contrat de plugin | .NET, NuGet | [Configuration de développement](/fr/SchulyPluginAbstractions/setup/development) |
| Site web | Angular | [Configuration de développement](/fr/SchulyWebsite/setup/development) |
| Cette documentation | VitePress | [Modifier cette documentation](/editing-these-docs) |

## Faire une modification

Chaque dépôt utilise le même processus :

1. Ouvre une issue avec un label.
2. Crée une branche depuis `main`, nommée `feature/<issue#>_PascalCase` ou `fix/<issue#>_PascalCase`.
3. Fais un commit avec un sujet court à l'impératif, par exemple `Add agenda filter`.
4. Ouvre une pull request avec un label. Son corps contient un résumé et `Closes #<issue>`, sans plan de test.
5. Fusionne la pull request en squash et supprime la branche.

Ne fais pas de commit directement sur `main`, et n'ajoute pas d'attribution à une IA dans les commits,
les pull requests ou les issues.

La page **Contribuer** de chaque projet indique ses propres règles.

## Labels

| Label | À utiliser pour |
|---|---|
| `bug` | Quelque chose qui ne fonctionne pas |
| `enhancement` | Une amélioration d'un comportement existant |
| `feature` | Une nouvelle fonctionnalité |
| `refactor` | Des changements internes sans changement de comportement |
| `CI/CD` | Les changements de build, de release et de workflow |
| `dependencies` | Les mises à jour de dépendances |
| `documentation` | Les changements limités à la documentation |
