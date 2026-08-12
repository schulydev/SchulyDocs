# Veröffentlichung

Die Veröffentlichung erfolgt **automatisch bei einem GitHub-Release** - du führst nie manuell
`dotnet nuget push` aus.

## Ablauf (`.github/workflows/nuget-publish.yml`)

Ausgelöst durch `release: published`. Zwei Jobs:

1. **`sync-version`** - checkt `main` aus, entfernt das führende `v` aus dem Release-Tag und
   vergleicht es mit der `<version>` in `application.properties`. Weichen sie voneinander ab,
   bearbeitet der Job die Datei, pusht einen Branch `release-sync/<version>`, öffnet einen mit
   `CI/CD` gelabelten PR und **merged ihn automatisch** (`gh pr merge --admin --squash
   --delete-branch`). So bleibt `application.properties` (die Single Source of Truth für die
   Package-Version) synchron mit dem Tag.
2. **`publish`** (`needs: sync-version`) - checkt `main` aus, richtet .NET `10.0.x` ein und
   führt dann aus:
   ```sh
   dotnet pack src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj \
     --configuration Release -o ./out
   dotnet nuget push ./out/*.nupkg \
     --api-key ${{ secrets.NUGET_API_KEY }} \
     --source https://api.nuget.org/v3/index.json \
     --skip-duplicate
   ```
   `--skip-duplicate` macht einen erneuten Lauf sicher, falls die Version bereits auf
   NuGet.org existiert.

### Woher Releases kommen

Releases werden von `.github/workflows/auto-release-on-main.yml` erzeugt, das **nur auslöst,
wenn sich die ausgelieferten Backend-DLLs ändern** (`paths:
src/Schuly.Plugin.Abstractions/libs/**`). Es berechnet die nächste Patch-Version aus
`application.properties` und führt `gh release create` aus. Releases für Vertragsänderungen
werden ansonsten von release-drafter gesteuert - siehe [Versionierung](../versioning.md).

## Package-Metadaten

Bearbeite die Metadaten in der `PropertyGroup` der csproj
(`src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj`): `PackageId`,
`Description`, `Authors`, `PackageProjectUrl`, `PackageLicenseExpression` (`MIT`),
`PackageTags` usw.

### Zwei READMEs

| Datei | Zielgruppe | Hinweise |
|---|---|---|
| `README.md` (Repo-Root) | GitHub | Zentriertes Logo, Badges, rohes HTML. |
| `src/Schuly.Plugin.Abstractions/NUGET_README.md` | NuGet.org | Reines Markdown mit **absoluten** Bild-URLs - NuGet.org rendert kein HTML, und relative Bildpfade würden nicht aufgelöst. |

Die csproj setzt `<PackageReadmeFile>README.md</PackageReadmeFile>` und packt
`NUGET_README.md` **als** `README.md` innerhalb des Package:

```xml
<None Include="NUGET_README.md" Pack="true" PackagePath="README.md" />
```

So zeigt die NuGet-Seite `NUGET_README.md`, während die GitHub-Repo-Seite die
`README.md` im Root zeigt.

### Icon

Das Package-Icon ist `assets/app_icon.png`, gepackt als `icon.png`:

```xml
<None Include="../../assets/app_icon.png" Pack="true" PackagePath="icon.png" />
```

und über `<PackageIcon>icon.png</PackageIcon>` eingebunden.
