# Distribution

Plugins folgen dem **Aniyomi-Stil**-Zwei-Branch-Modell:

- `main` - die C#-Plugin-Quellprojekte.
- `repo` - gebaute DLLs plus ein maschinenlesbarer Index, alles automatisch generiert.

## Der Build-/Publish-Workflow

`.github/workflows/build_push.yml` läuft bei Pushes auf `main`, die `src/Schuly.Plugin.*/**`
(oder den Workflow selbst) betreffen, sowie bei manuellem Auslösen. Er besteht aus drei Jobs:

1. **discover** - globbt `src/**/Schuly.Plugin.*.csproj` und erzeugt eine Build-Matrix. Ein neuer
   Plugin-Ordner mit einer csproj wird ohne Workflow-Änderung erkannt.
2. **build** (pro Plugin) - `dotnet publish -c Release`, danach werden bereitgestellt:
   - `dll/<AssemblyName>-v<Version>.dll` - die Plugin-Assembly, eigenständig ausgeliefert, damit
     Betreiber sie unabhängig pinnen/austauschen können.
   - `dll/<AssemblyName>-v<Version>-deps.zip` - ihre Drittanbieter-Abhängigkeiten. Vom Host
     bereitgestellte Assemblies werden entfernt (ASP.NET Core, EF Core, Npgsql, Mediator und die
     Schuly-Host-Assemblies einschliesslich `Schuly.Plugin.Abstractions`); nur echte
     Drittanbieter-NuGet-Abhängigkeiten (Kiota, AngleSharp, …) werden gebündelt. Ein Plugin ohne
     solche erhält ein reines Marker-Zip, damit das Index-Schema einheitlich bleibt.
   - eine Metadaten-JSON pro Plugin (`name`, `pkg`, `dll`, `deps`, `version`, `description`,
     `authors`), aus der csproj gelesen über `dotnet msbuild -getProperty`.
3. **publish** - führt die JSONs der einzelnen Plugins zu einer `index.json` (sortiert nach Name)
   und einer minifizierten `index.min.json` zusammen, kopiert die DLLs + Dependency-Zips und
   committet alles in den `repo`-Branch.

`AssemblyName`, `Version`, `Description` und `Authors` stammen also direkt aus der
`PropertyGroup` der jeweiligen `.csproj` - halte sie aktuell.

## Installation (für Betreiber)

Vorgebaute Artefakte werden von `raw.githubusercontent.com/schulydev/SchulyPlugins/repo`
ausgeliefert. Lade sie in den `/app/plugins/`-Ordner des Backends herunter:

```sh
BASE=https://raw.githubusercontent.com/schulydev/SchulyPlugins/repo
NAME=Schuly.Plugin.Schulware
VERSION=2.4.2

# 1. Plugin-DLL
curl -L "$BASE/dll/$NAME-v$VERSION.dll" -o /app/plugins/$NAME.dll

# 2. Ihre Drittanbieter-Abhängigkeiten
curl -L "$BASE/dll/$NAME-v$VERSION-deps.zip" -o /tmp/deps.zip
unzip -o /tmp/deps.zip -d /app/plugins/

# 3. Die Schuly.Plugin.<Name>.yml des Plugins in das plugins-config/ des Backends legen
```

Das Backend stellt Framework- und Host-geteilte Assemblies bereits bereit, daher müssen nur die
Plugin-DLL und ihre gebündelten Drittanbieter-Abhängigkeiten in `plugins/` landen.
`index.min.json` ist der Katalog, den Clients lesen, um verfügbare Plugins und Versionen zu
entdecken.
