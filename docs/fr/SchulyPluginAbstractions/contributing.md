# Contribuer

Ce dépôt est le **contrat publié stable**. Garde-le petit, garde-le stable. Presque chaque
changement est régi par le [versionnement](versioning.md) - lis-le d'abord.

## Règles de dépendances

L'assembly abstractions ne doit référencer **que** :

- la BCL, et
- la référence de framework `Microsoft.AspNetCore.App`.

N'ajoute **pas** de référence vers `Schuly.Application` (ces types vivent dans
[SchulyBackend](https://github.com/schulydev/SchulyBackend) et ne sont pas publiés).

> Le dépôt embarque les DLL du backend `Schuly.Domain.dll` et `Schuly.Infrastructure.dll`
> comme binaires précompilés sous `src/Schuly.Plugin.Abstractions/libs/` (synchronisés depuis
> le backend) afin que les plugins bénéficient d'un accès typé à la base de données ; les
> packages EF Core dont ces DLL ont besoin sont déclarés dans le csproj. Ne transforme pas ces
> DLL en références de projet et ne tire pas davantage de code source du backend dans ce dépôt.

## Workflow (imposé)

1. **Ouvre une issue labellisée** décrivant le changement. Utilise le bon label pour que
   release-drafter détermine correctement la prochaine version (`breaking-change`, `feature`,
   `documentation`, `CI/CD`, `dependencies`, `bug`, `refactor`).
2. **Branche depuis `main`** : `feature/<issue#>_PascalCase` ou `fix/<issue#>_PascalCase`. Ne
   commite jamais sur `main`.
3. **Ouvre une PR** avec `Closes #<issue>`. Le corps de la PR se limite au **Summary +
   `Closes #<issue>`** - pas de plan de test.
4. **Squash-merge** et supprime la branche.

Les sujets de commit sont courts et à l'impératif.

## Aucune attribution IA

N'ajoute jamais d'attribution IA / assistant où que ce soit - ni dans les messages de commit,
ni dans les descriptions de PR, ni dans les issues. Aucun trailer `Co-Authored-By`, aucune
ligne « generated with ». Jamais.

## Choisir un bump de version

Voir le tableau dans [versionnement](versioning.md). Le label de PR que tu choisis pilote la
version de release - choisis-le donc avec soin.
