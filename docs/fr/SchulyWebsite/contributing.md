# Contributing

## Workflow imposé

**Ne travaille jamais directement sur `main`.** Chaque changement suit ce processus :

1. **Ouvre une issue labellisée** décrivant le changement.
2. **Crée une branche** à partir de `main` : `feature/<issue#>_PascalCase` ou
   `fix/<issue#>_PascalCase`.
3. **Ouvre une PR** qui référence l'issue avec `Closes #<issue>`.
   - Le corps de la PR contient **uniquement un résumé + `Closes #<issue>`**. Pas de
     plan de test.
4. **Squash-merge** puis supprime la branche.

### Labels de PR

`bug`, `enhancement`, `feature`, `refactor`, `CI/CD`, `dependencies`, `documentation`.

### Messages de commit

- Sujet court à l'impératif (par ex. `Add FAQ section`).

## Règle absolue

**Aucune attribution IA / Claude, nulle part** - ni dans les commits, ni dans les
corps de PR, ni dans les issues. Jamais. Pas de `Co-Authored-By`, de "Generated with"
ou d'équivalent.

## Standards de code

Respecte les **conventions de code Angular 20** documentées dans
[architecture.md](architecture.md#conventions-de-code-angular-20).

## Voir aussi

- [Configuration du développement](setup/development.md)
- [Déploiement](setup/deployment.md)
- [Release](setup/release.md)
