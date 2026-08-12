# Pubblicazione

La pubblicazione è **automatica a ogni release GitHub** - non esegui mai `dotnet nuget push`
manualmente.

## Flusso (`.github/workflows/nuget-publish.yml`)

Attivato su `release: published`. Due job:

1. **`sync-version`** - esegue il checkout di `main`, rimuove la `v` iniziale dal tag di
   release e la confronta con la `<version>` in `application.properties`. Se differiscono, il
   job modifica il file, pusha un branch `release-sync/<version>`, apre una PR etichettata
   `CI/CD` e la **merge automaticamente** (`gh pr merge --admin --squash --delete-branch`).
   Questo mantiene `application.properties` (l'unica fonte di verità per la versione del
   pacchetto) allineata al tag.
2. **`publish`** (`needs: sync-version`) - esegue il checkout di `main`, imposta .NET
   `10.0.x`, quindi:
   ```sh
   dotnet pack src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj \
     --configuration Release -o ./out
   dotnet nuget push ./out/*.nupkg \
     --api-key ${{ secrets.NUGET_API_KEY }} \
     --source https://api.nuget.org/v3/index.json \
     --skip-duplicate
   ```
   `--skip-duplicate` rende sicura una nuova esecuzione se la versione esiste già su
   NuGet.org.

### Da dove vengono le release

Le release vengono create da `.github/workflows/auto-release-on-main.yml`, che si attiva
**solo quando cambiano le DLL del backend distribuite** (`paths:
src/Schuly.Plugin.Abstractions/libs/**`). Calcola la successiva versione patch a partire da
`application.properties` ed esegue `gh release create`. Le release per le modifiche al
contratto sono invece guidate da release-drafter - vedi [versionamento](../versioning.md).

## Metadati del pacchetto

Modifica i metadati nel `PropertyGroup` del csproj
(`src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj`): `PackageId`,
`Description`, `Authors`, `PackageProjectUrl`, `PackageLicenseExpression` (`MIT`),
`PackageTags`, ecc.

### Due README

| File | Destinatari | Note |
|---|---|---|
| `README.md` (root del repository) | GitHub | Logo centrato, badge, HTML grezzo. |
| `src/Schuly.Plugin.Abstractions/NUGET_README.md` | NuGet.org | Markdown semplice con URL delle immagini **assolute** - NuGet.org non renderizza l'HTML, e i percorsi immagine relativi non verrebbero risolti. |

Il csproj imposta `<PackageReadmeFile>README.md</PackageReadmeFile>` e pacchettizza
`NUGET_README.md` **come** `README.md` all'interno del pacchetto:

```xml
<None Include="NUGET_README.md" Pack="true" PackagePath="README.md" />
```

Così la pagina NuGet mostra `NUGET_README.md`, mentre la pagina GitHub del repository mostra
il `README.md` nella root.

### Icona

L'icona del pacchetto è `assets/app_icon.png`, pacchettizzata come `icon.png`:

```xml
<None Include="../../assets/app_icon.png" Pack="true" PackagePath="icon.png" />
```

e collegata tramite `<PackageIcon>icon.png</PackageIcon>`.
