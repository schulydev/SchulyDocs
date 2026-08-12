# Contribuer

Un flux de travail court et appliqué garde l'historique propre et prêt à être publié.

## Flux de travail

1. **Ouvre une issue étiquetée** décrivant le changement. Applique un label parmi la
   taxonomie ci-dessous.
2. **Branche depuis `main`** : `feature/<issue#>_PascalCase` ou `fix/<issue#>_PascalCase`.
   Ne commite jamais directement sur `main`.
3. **Ouvre une PR** (également étiquetée) ciblant `main`. Le corps de la PR se limite à
   **Summary** plus `Closes #<issue>` - rien d'autre (pas de plan de tests).
4. **Squash-merge** puis supprime la branche.

## Messages de commit

- Sujet court, à l'impératif (par ex. `Add absences endpoint`).
- Pas de bruit dans le corps du message ; reste centré sur le quoi/pourquoi.

## Labels

Utilise un label cohérent avec la taxonomie de l'organisation :

| Label | Utilisation |
|---|---|
| `bug` | Un défaut / comportement incorrect. |
| `enhancement` | Amélioration d'un comportement existant. |
| `feature` | Nouvelle fonctionnalité. |
| `refactor` | Restructuration interne, sans changement de comportement. |
| `CI/CD` | Changements de build, de release et de workflow. |
| `dependencies` | Montées de version de dépendances. |
| `documentation` | Changements limités à la documentation. |

## Versionnement

`application.properties` est la source de vérité unique pour la version et est
synchronisé automatiquement depuis le tag de release lors de la publication d'une
release - voir [Production](setup/production.md). Ne l'incrémente pas à la main dans
les PR de fonctionnalité.

## Attentes sur le code

- Respecte les [règles de couches](architecture.md) : `Schuly.Application` ne doit pas
  référencer `Schuly.Infrastructure`.
- Les contrôleurs restent minces et délèguent à Mediator ; la logique vit dans les
  handlers.
- Ajoute des tests dans `Schuly.Tests` là où cela a du sens.
