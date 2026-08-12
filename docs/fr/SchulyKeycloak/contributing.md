# Contribuer

Ce dépôt suit le même workflow que les autres projets Schuly. Il est obligatoire -
respecte-le pour chaque changement.

## Workflow

1. **Ouvre une issue** décrivant le changement, avec un label approprié (voir
   ci-dessous).
2. **Crée une branche depuis `main`** - ne travaille jamais directement sur `main` :
   - `feature/<issue#>_PascalCase` pour les fonctionnalités/améliorations
   - `fix/<issue#>_PascalCase` pour les corrections de bugs
3. **Ouvre une PR** ciblant `main`. Le corps de la PR contient **uniquement un résumé
   + `Closes #<issue>`** - pas de plan de test, pas de section supplémentaire.
4. **Fais un squash-merge** de la PR et **supprime la branche**.

## Labels

Utilise l'un des suivants : `bug`, `enhancement`, `feature`, `refactor`, `CI/CD`,
`dependencies`, `documentation`.

## Règles strictes

- **Aucune attribution à une IA / à Claude, nulle part** - ni dans les commits, ni
  dans les titres ou corps de PR, ni dans les issues. Pas de « Co-Authored-By », de
  « Generated with » ou d'équivalent. Jamais.
- Garde les sujets de commit courts et à l'impératif.
- Utilise les générateurs en ligne de commande (`gh issue create`, `gh pr create`, …)
  quand ils existent.

## Gestion des versions

Les versions sont suivies dans `application.properties` et synchronisées avec le tag
de release par la CI - ne les incrémente pas à la main. Voir [Release](setup/release.md).
