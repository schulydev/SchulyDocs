# Contribuer

Le workflow de contribution est **imposé** - suis-le à la lettre.

## Règles strictes

- **Ne jamais travailler directement sur `main`.** Tout changement passe par un cycle
  issue → branche → PR.
- **Aucune attribution à une IA / à Claude, jamais.** Les messages de commit, les
  titres/descriptions de PR et les textes d'issue ne doivent mentionner ni IA, ni
  Claude, ni aucun assistant, et ne doivent contenir aucune ligne `Co-Authored-By` ni
  "Generated with".
- **Pas de plan de test dans les PR.** Le corps de la PR se limite à un **résumé +
  `Closes #<issue>`**.
- **Privilégier les générateurs CLI** dès qu'il en existe un (`gh issue create`,
  `gh pr create`, etc.) plutôt que des étapes manuelles.

## Workflow

1. **Créer une issue labellisée** décrivant le changement.

   ```sh
   gh issue create --title "..." --body "..." --label <label>
   ```

2. **Créer une branche à partir de `main`**, en utilisant le numéro de l'issue et un
   slug en `PascalCase` :

   ```sh
   git switch -c feature/<issue#>_PascalCase   # nouvelle fonctionnalité
   git switch -c fix/<issue#>_PascalCase       # correction de bug
   ```

3. **Committer** avec un sujet court à l'impératif (p. ex. `Add agenda filter`).

4. **Ouvrir une PR** (labellisée) dont le corps se limite à un court résumé et à la
   référence de fermeture :

   ```sh
   gh pr create --title "..." --label <label> --body "Summary of the change.

   Closes #<issue>"
   ```

5. **Merger en squash et supprimer la branche** une fois la PR approuvée.

## Convention de nommage des branches

| Type | Modèle | Exemple |
| --- | --- | --- |
| Feature | `feature/<issue#>_PascalCase` | `feature/123_AgendaFilter` |
| Fix | `fix/<issue#>_PascalCase` | `fix/124_LoginCrash` |

## Labels

Applique le label approprié à la fois sur l'issue et sur la PR :

| Label | À utiliser pour |
| --- | --- |
| `bug` | Rapports de bugs |
| `enhancement` | Améliorations d'un comportement existant |
| `feature` | Nouvelle fonctionnalité |
| `refactor` | Restructuration interne, sans changement de comportement |
| `CI/CD` | Changements de pipeline / workflow |
| `dependencies` | Montées de version des dépendances |
| `documentation` | Changements concernant uniquement la documentation |

## Avant d'ouvrir une PR

Exécute les vérifications de qualité (voir
[Configuration de développement](setup/development.md)) :

```sh
bun run analyze
bun run test
bun run format
```
