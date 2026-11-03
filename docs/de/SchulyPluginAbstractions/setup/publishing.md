# Veröffentlichung

Veröffentliche eine neue Package-Version, indem du ein GitHub-Release veröffentlichst. Du führst
`dotnet nuget push` nie von Hand aus.

## Release erstellen

Erstelle Releases von Hand mit `gh release create vX.Y.Z`. Nutze dabei die Version, die release-drafter aus
den Labels der zusammengeführten PRs ermittelt. Siehe [Versionierung](../versioning.md).

## Was der Workflow macht

[`nuget-publish.yml`](https://github.com/schulydev/SchulyPluginAbstractions/blob/main/.github/workflows/nuget-publish.yml)
läuft bei `release: published`. Er hat zwei Jobs:

1. **`sync-version`** checkt `main` aus, entfernt das führende `v` vom Release-Tag und vergleicht ihn mit
   `<version>` in `application.properties`. Wenn sie sich unterscheiden, macht der Job Folgendes:
   1. Er bearbeitet die Datei und pusht einen `release-sync/<version>`-Branch.
   2. Er eröffnet einen PR mit den Labels `CI/CD` und `skip-changelog`.
   3. Er führt ihn automatisch mit `gh pr merge --admin --squash --delete-branch` zusammen.

   So bleibt `application.properties`, die einzige Quelle für die Package-Version, im Einklang mit dem Tag.
2. **`publish`** (`needs: sync-version`) checkt `main` aus, richtet .NET `10.0.x` ein und führt dann aus:

   ```sh
   dotnet pack src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj \
     --configuration Release -o ./out
   dotnet nuget push ./out/*.nupkg \
     --api-key ${{ secrets.NUGET_API_KEY }} \
     --source https://api.nuget.org/v3/index.json \
     --skip-duplicate
   ```

   `--skip-duplicate` macht eine erneute Ausführung sicher, wenn die Version auf NuGet.org schon existiert.

## Package-Metadaten

Bearbeite die Metadaten in der `PropertyGroup` von
[`Schuly.Plugin.Abstractions.csproj`](https://github.com/schulydev/SchulyPluginAbstractions/blob/main/src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj):
`PackageId`, `Description`, `Authors`, `PackageProjectUrl`, `RepositoryUrl`, `RepositoryType`,
`PackageLicenseExpression` (`MIT`) und `PackageTags`.

### READMEs

Das Repo hat zwei READMEs:

| Datei | Zielgruppe | Hinweise |
|---|---|---|
| `README.md` (Repo-Root) | GitHub | Zentriertes Logo, Badges, rohes HTML. |
| `src/Schuly.Plugin.Abstractions/NUGET_README.md` | NuGet.org | Reines Markdown mit absoluten Bild-URLs. NuGet.org rendert kein HTML, und relative Bildpfade werden nicht aufgelöst. |

Die csproj setzt `<PackageReadmeFile>README.md</PackageReadmeFile>` und packt `NUGET_README.md` als
`README.md` ins Package:

```xml
<None Include="NUGET_README.md" Pack="true" PackagePath="README.md" />
```

Die NuGet-Seite zeigt also `NUGET_README.md`, und die GitHub-Repo-Seite zeigt das `README.md` im Root.

### Icon

Das Package-Icon ist `assets/app_icon.png`, gepackt als `icon.png` und gesetzt mit
`<PackageIcon>icon.png</PackageIcon>`:

```xml
<None Include="../../assets/app_icon.png" Pack="true" PackagePath="icon.png" />
```
