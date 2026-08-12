# Publication

La publication est **automatique lors d'une release GitHub** - tu n'exécutes jamais
`dotnet nuget push` à la main.

## Flux (`.github/workflows/nuget-publish.yml`)

Déclenché sur `release: published`. Deux jobs :

1. **`sync-version`** - checkout de `main`, retire le `v` initial du tag de release et le
   compare à la `<version>` dans `application.properties`. En cas de différence, le job édite
   le fichier, pousse une branche `release-sync/<version>`, ouvre une PR labellisée `CI/CD` et
   la **merge automatiquement** (`gh pr merge --admin --squash --delete-branch`). Cela maintient
   `application.properties` (la source de vérité unique pour la version du package) synchronisé
   avec le tag.
2. **`publish`** (`needs: sync-version`) - checkout de `main`, installe .NET `10.0.x`, puis :
   ```sh
   dotnet pack src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj \
     --configuration Release -o ./out
   dotnet nuget push ./out/*.nupkg \
     --api-key ${{ secrets.NUGET_API_KEY }} \
     --source https://api.nuget.org/v3/index.json \
     --skip-duplicate
   ```
   `--skip-duplicate` rend une nouvelle exécution sûre si la version existe déjà sur
   NuGet.org.

### D'où viennent les releases

Les releases sont créées par `.github/workflows/auto-release-on-main.yml`, qui ne se déclenche
**que lorsque les DLL du backend livrées changent** (`paths:
src/Schuly.Plugin.Abstractions/libs/**`). Il calcule la prochaine version de patch à partir de
`application.properties` et exécute `gh release create`. Les releases pour les changements de
contrat sont sinon pilotées par release-drafter - voir [versionnement](../versioning.md).

## Métadonnées du package

Modifie les métadonnées dans le `PropertyGroup` du csproj
(`src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj`) : `PackageId`,
`Description`, `Authors`, `PackageProjectUrl`, `PackageLicenseExpression` (`MIT`),
`PackageTags`, etc.

### Deux README

| Fichier | Public | Notes |
|---|---|---|
| `README.md` (racine du dépôt) | GitHub | Logo centré, badges, HTML brut. |
| `src/Schuly.Plugin.Abstractions/NUGET_README.md` | NuGet.org | Markdown simple avec des URL d'image **absolues** - NuGet.org ne rend pas le HTML, et les chemins d'image relatifs ne se résoudraient pas. |

Le csproj définit `<PackageReadmeFile>README.md</PackageReadmeFile>` et packe
`NUGET_README.md` **en tant que** `README.md` dans le package :

```xml
<None Include="NUGET_README.md" Pack="true" PackagePath="README.md" />
```

Ainsi, la page NuGet affiche `NUGET_README.md`, tandis que la page GitHub du dépôt affiche le
`README.md` à la racine.

### Icône

L'icône du package est `assets/app_icon.png`, packée sous le nom `icon.png` :

```xml
<None Include="../../assets/app_icon.png" Pack="true" PackagePath="icon.png" />
```

et reliée via `<PackageIcon>icon.png</PackageIcon>`.
