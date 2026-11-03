# Pubblicazione

Pubblica una nuova versione del pacchetto pubblicando una release su GitHub. Non esegui mai `dotnet nuget push` a mano.

## Crea una release

Crea le release a mano con `gh release create vX.Y.Z`, usando la versione che release-drafter ricava dalle
etichette delle PR unite. Vedi [versionamento](../versioning.md).

## Cosa fa il workflow

[`nuget-publish.yml`](https://github.com/schulydev/SchulyPluginAbstractions/blob/main/.github/workflows/nuget-publish.yml)
viene eseguito su `release: published`. Ha due job:

1. **`sync-version`** fa il checkout di `main`, toglie la `v` iniziale dal tag della release e lo confronta con
   `<version>` in `application.properties`. Se differiscono:
   1. Modifica il file e fa il push di un branch `release-sync/<version>`.
   2. Apre una PR con le etichette `CI/CD` e `skip-changelog`.
   3. La unisce automaticamente con `gh pr merge --admin --squash --delete-branch`.

   Questo mantiene `application.properties`, l'unica fonte di verità per la versione del pacchetto, allineato con
   il tag.
2. **`publish`** (`needs: sync-version`) fa il checkout di `main`, configura .NET `10.0.x`, poi esegue:

   ```sh
   dotnet pack src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj \
     --configuration Release -o ./out
   dotnet nuget push ./out/*.nupkg \
     --api-key ${{ secrets.NUGET_API_KEY }} \
     --source https://api.nuget.org/v3/index.json \
     --skip-duplicate
   ```

   `--skip-duplicate` rende sicura una nuova esecuzione se la versione esiste già su NuGet.org.

## Metadati del pacchetto

Modifica i metadati nel `PropertyGroup` di
[`Schuly.Plugin.Abstractions.csproj`](https://github.com/schulydev/SchulyPluginAbstractions/blob/main/src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj):
`PackageId`, `Description`, `Authors`, `PackageProjectUrl`, `RepositoryUrl`, `RepositoryType`,
`PackageLicenseExpression` (`MIT`) e `PackageTags`.

### README

Il repository ha due README:

| File | Destinatari | Note |
|---|---|---|
| `README.md` (radice del repository) | GitHub | Logo centrato, badge, HTML grezzo. |
| `src/Schuly.Plugin.Abstractions/NUGET_README.md` | NuGet.org | Markdown semplice con URL assoluti per le immagini. NuGet.org non mostra l'HTML e i percorsi relativi delle immagini non vengono risolti. |

Il csproj imposta `<PackageReadmeFile>README.md</PackageReadmeFile>` e impacchetta `NUGET_README.md` come
`README.md` all'interno del pacchetto:

```xml
<None Include="NUGET_README.md" Pack="true" PackagePath="README.md" />
```

Quindi la pagina NuGet mostra `NUGET_README.md`, e la pagina del repository GitHub mostra il `README.md` nella radice.

### Icona

L'icona del pacchetto è `assets/app_icon.png`, impacchettata come `icon.png` e impostata con
`<PackageIcon>icon.png</PackageIcon>`:

```xml
<None Include="../../assets/app_icon.png" Pack="true" PackagePath="icon.png" />
```
