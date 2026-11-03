# Contribuer

Ces règles s'appliquent à ce dépôt. Pour les branches, les commits, les pull requests et les labels, suis
le [processus partagé](/fr/contribute/).

Ce dépôt est le contrat publié, donc garde-le petit et stable. Le [versionnement](versioning.md) encadre
presque chaque changement. Lis-le d'abord.

## Règles de dépendances

L'assembly des abstractions peut référencer uniquement :

- la BCL
- la référence de framework `Microsoft.AspNetCore.App`

N'ajoute pas de références à `Schuly.Application`, `Schuly.Domain` ou `Schuly.Infrastructure`. Ces types se
trouvent dans [SchulyServer](https://github.com/schulydev/SchulyServer) et ne sont pas publiés.

Les plugins ne voient jamais les entités ni le `DbContext` du backend. Ils écrivent les données scolaires par
`ISchoolData` avec les records simples de `SchoolRecords.cs`. Garde ces records sans types du backend, et
n'ajoute des champs que d'une manière rétrocompatible.

## Choisir un incrément de version

Le label de PR que tu choisis détermine la version de la release, donc choisis-le avec soin. En plus des
labels partagés, ce dépôt utilise `breaking-change`. Voir le tableau dans [versionnement](versioning.md).
