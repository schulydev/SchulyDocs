# Versionnement

Utilise cette page pour choisir le bon incrément de version pour un changement du contrat.

Ce package suit un semver strict. Les plugins référencent le package et l'hôte fournit l'assembly à
l'exécution, donc un changement imprudent casse tous les plugins en service.

## Règles

| Changement | Incrément | Label de PR |
|---|---|---|
| Changer une signature de méthode, ajouter une méthode à une interface existante ou renommer un membre | **MAJOR** | `breaking-change` |
| Ajouter une nouvelle interface optionnelle ou une méthode avec implémentation par défaut | **MINOR** | `feature` |
| Ajustements de documentation, de métadonnées ou d'empaquetage | **PATCH** | Aucun nécessaire |

## Comment la version est résolue

- `application.properties` contient la `<version>` actuelle. C'est la seule source de vérité.
  `src/Directory.Build.props` la lit dans `$(Version)` au moment du build et du pack.
- **release-drafter** (`.github/release-drafter.yml`) résout la version suivante à partir des labels des PR
  fusionnées et rédige le brouillon du changelog :
  - `breaking` ou `breaking-change` : major
  - `feature`, `enhancement` ou `minor` : minor
  - tout le reste : patch
- Faire la release lance le processus de publication, qui synchronise `application.properties` avec le tag
  avant le pack. Voir [publication](setup/publishing.md).

## Stabilité de la version d'assembly

`Directory.Build.props` épingle la version d'assembly à `MAJOR.MINOR.0.0`. `FileVersion` et
`InformationalVersion` portent la version complète.

Un plugin compilé pour n'importe quel `MAJOR.MINOR.x` se lie à un seul assembly `MAJOR.MINOR.0.0`. Les
incréments de patch n'imposent pas de recompiler tous les plugins et ne provoquent pas d'échecs de chargement
de types entre versions de patch. Seul un incrément MINOR ou MAJOR change la version d'assembly de liaison,
ce qui est une raison de plus de suivre exactement le tableau ci-dessus.

## Avant la 1.0

Tant que la version est `0.x`, un changement incompatible incrémente MINOR (`0.3` à `0.4`) au lieu de MAJOR.
Fais la release avec un `gh release create v0.<next>.0` explicite, pas avec la version que release-drafter
propose pour un label `breaking-change`.

## Compatibilité au chargement

Le backend compare la version d'assembly de `Schuly.Plugin.Abstractions` pour laquelle un plugin a été compilé
avec la sienne. Il refuse un plugin incompatible avec un message de journal clair, pour que le plugin
n'échoue pas plus tard avec une erreur de chargement de type.

| Contrat de l'hôte | Un plugin est compatible quand |
|---|---|
| `1.x` et suivantes | Il a le même MAJOR, et son MINOR n'est pas plus récent que celui de l'hôte |
| `0.x` | Il a le même MAJOR.MINOR |

Pendant `0.x`, les plugins ont donc besoin d'une recompilation après chaque release MINOR.
