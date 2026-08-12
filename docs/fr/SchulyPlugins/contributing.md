# Contribuer

Le processus ci-dessous est **obligatoire** - ne jamais committer directement sur `main`.

## Processus

1. **Ouvre une issue étiquetée** décrivant le changement. Choisis l'étiquette appropriée
   (par ex. `new-plugin` pour un nouveau plugin, plus `bug` / `enhancement` / `documentation` /
   etc.).
2. **Crée une branche** à partir de `main` : `feature/<issue#>_PascalCase` ou
   `fix/<issue#>_PascalCase`.
3. **Committe** avec un sujet court et à l'impératif (par ex. `Add OdaOrg vacation sync`).
4. **Ouvre une PR** qui lie l'issue. Le corps de la PR contient **uniquement le résumé et
   `Closes #<issue>`** - pas de plan de test.
5. **Squash-merge**, puis supprime la branche.

## Règles strictes

- **Aucune attribution IA/Claude, nulle part - jamais.** Ni dans les messages de commit, ni dans
  les titres/corps de PR, ni dans le texte des issues. Pas de trailer `Co-Authored-By`, pas de
  ligne "Generated with".
- Utilise les générateurs CLI quand ils existent (`gh issue create`, `gh pr create`,
  `dotnet ef migrations add`, `kiota`, …).
- Garde les changements ciblés : l'index de distribution publié lit `Version` / `Description` /
  `Authors` depuis le csproj de chaque plugin, donc incrémente `<Version>` quand tu modifies le
  comportement d'un plugin.

## Voir aussi

- [adding-a-plugin.md](adding-a-plugin.md) - gabarit + cycle de vie.
- [migrations.md](migrations.md) - migrations EF Core.
- [setup/kiota-client.md](setup/kiota-client.md) - régénérer le client Schulware.
- [setup/distribution.md](setup/distribution.md) - comment les merges vers `main` sont livrés.
