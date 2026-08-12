# Versionnement

Ce package est un contrat publié, le versionnement est donc un **semver strict**. L'intérêt
même de ce dépôt est la stabilité : les plugins référencent le package, et l'hôte fournit
l'assembly à l'exécution, donc un changement inconsidéré casse tous les plugins déployés.

## Règles

| Changement | Bump | Label de PR |
|---|---|---|
| Modifier la signature d'une méthode, ajouter une méthode à une interface existante, ou renommer un membre | **MAJOR** | `breaking-change` |
| Ajouter une nouvelle interface optionnelle, ou une méthode avec implémentation par défaut | **MINOR** | `feature` |
| Ajustements de doc / métadonnées / packaging | **PATCH** | *(par défaut - aucun label requis)* |

## Comment la version est résolue

- `application.properties` contient la `<version>` actuelle ; c'est la source de vérité unique,
  lue dans `$(Version)` par `src/Directory.Build.props` au build/pack.
- **release-drafter** (`.github/release-drafter.yml`) détermine la *prochaine* version à
  partir des labels des PR mergées : `breaking-change` → major, `feature` → minor, tout le
  reste → patch. Il rédige également le changelog.
- Créer la release exécute ensuite le flux de publication, qui synchronise
  `application.properties` avec le tag avant le packaging. Voir
  [publication](setup/publishing.md).

## Stabilité de la version d'assembly

`Directory.Build.props` fige la version d'**assembly** sur `MAJOR.MINOR.0.0` (tandis que
`FileVersion`/`InformationalVersion` portent la version complète). Un plugin construit contre
n'importe quel `MAJOR.MINOR.x` se lie à une unique assembly `MAJOR.MINOR.0.0`, si bien que les
bumps de patch ne forcent pas un rebuild de chaque plugin et ne provoquent pas d'échecs de
chargement de type entre versions de patch. Seul un bump **MINOR ou MAJOR** modifie la version
d'assembly de liaison - une raison de plus de suivre exactement le tableau ci-dessus.
