# Publication

Publie une nouvelle version du package en publiant une release GitHub. Tu n'exécutes jamais
`dotnet nuget push` à la main.

## Faire une release

Fais les releases à la main avec `gh release create vX.Y.Z`, en utilisant la version que release-drafter
résout à partir des labels des PR fusionnées. Voir [versionnement](../versioning.md).

## Ce que fait le workflow

[`nuget-publish.yml`](https://github.com/schulydev/SchulyPluginAbstractions/blob/main/.github/workflows/nuget-publish.yml)
s'exécute sur `release: published`. Il a deux jobs :

1. **`sync-version`** récupère `main`, retire le `v` initial du tag de release et le compare à `<version>`
   dans `application.properties`. S'ils diffèrent, il :
   1. Modifie le fichier et pousse une branche `release-sync/<version>`.
   2. Ouvre une PR avec les labels `CI/CD` et `skip-changelog`.
   3. La fusionne automatiquement avec `gh pr merge --admin --squash --delete-branch`.

   Cela garde `application.properties`, la seule source de vérité pour la version du package, aligné sur
   le tag.
2. **`publish`** (`needs: sync-version`) récupère `main`, installe .NET `10.0.x`, puis exécute :

   ```sh
   dotnet pack src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj \
     --configuration Release -o ./out
   dotnet nuget push ./out/*.nupkg \
     --api-key ${{ secrets.NUGET_API_KEY }} \
     --source https://api.nuget.org/v3/index.json \
     --skip-duplicate
   ```

   `--skip-duplicate` rend une nouvelle exécution sûre si la version existe déjà sur NuGet.org.

## Métadonnées du package

Modifie les métadonnées dans le `PropertyGroup` de
[`Schuly.Plugin.Abstractions.csproj`](https://github.com/schulydev/SchulyPluginAbstractions/blob/main/src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj) :
`PackageId`, `Description`, `Authors`, `PackageProjectUrl`, `RepositoryUrl`, `RepositoryType`,
`PackageLicenseExpression` (`MIT`) et `PackageTags`.

### README

Le dépôt a deux README :

| Fichier | Public | Remarques |
|---|---|---|
| `README.md` (racine du dépôt) | GitHub | Logo centré, badges, HTML brut. |
| `src/Schuly.Plugin.Abstractions/NUGET_README.md` | NuGet.org | Markdown simple avec des URL d'images absolues. NuGet.org n'affiche pas le HTML, et les chemins d'images relatifs ne se résolvent pas. |

Le csproj définit `<PackageReadmeFile>README.md</PackageReadmeFile>` et empaquette `NUGET_README.md` sous le
nom `README.md` dans le package :

```xml
<None Include="NUGET_README.md" Pack="true" PackagePath="README.md" />
```

La page NuGet affiche donc `NUGET_README.md`, et la page du dépôt GitHub affiche le `README.md` de la racine.

### Icône

L'icône du package est `assets/app_icon.png`, empaquetée sous le nom `icon.png` et définie avec
`<PackageIcon>icon.png</PackageIcon>` :

```xml
<None Include="../../assets/app_icon.png" Pack="true" PackagePath="icon.png" />
```
