# Distribution

Diese Seite erklärt, wie Plugins von `main` auf einen Server kommen. Plugins nutzen das Zwei-Branch-Modell im
Aniyomi-Stil:

- `main` enthält die C#-Quellprojekte der Plugins.
- `repo` enthält gebaute DLLs und einen maschinenlesbaren Index, alles automatisch generiert.

## Der Build- und Publish-Workflow

[`build_push.yml`](https://github.com/schulydev/SchulyPlugins/blob/main/.github/workflows/build_push.yml)
läuft bei Pushes auf `main`, die `src/Schuly.Plugin.*/**` oder den Workflow selbst betreffen, und bei manuellem Start.
Eine Änderung nur in `src/Shared/` löst ihn nicht aus.

Er hat drei Jobs:

1. **discover** findet jede `src/<folder>/Schuly.Plugin.*.csproj` und gibt eine Build-Matrix aus. Ein neuer Plugin-Ordner
   mit einer csproj braucht keine Workflow-Änderung.
2. **build** führt für jedes Plugin `dotnet publish -c Release` aus und stellt dann bereit:
   - `dll/<AssemblyName>-v<Version>.dll`: die Plugin-Assembly.
   - `dll/<AssemblyName>-v<Version>-deps.zip`: seine Drittanbieter-Abhängigkeiten, zum Beispiel Kiota oder AngleSharp.
     Das Zip lässt `Microsoft.AspNetCore.*`, `Microsoft.Extensions.*`, `Microsoft.EntityFrameworkCore.*`, `Npgsql.*`,
     `Mediator.*` und `Schuly.Plugin.Abstractions.dll` weg, die der Server bereitstellt. Ein Plugin ohne Abhängigkeiten
     erhält ein Zip nur mit einem Marker, damit das Index-Schema einheitlich bleibt.
   - Ein Metadaten-JSON für das Plugin mit `name`, `pkg`, `dll`, `deps`, `version`, `contract`, `description` und
     `authors`. `contract` ist die MAJOR.MINOR von `Schuly.Plugin.Abstractions`, die das Plugin aufgelöst hat. `name`,
     `version`, `description` und `authors` kommen über `dotnet msbuild -getProperty` aus der csproj.
3. **publish** führt die JSON-Dateien zu `index.json`, sortiert nach Name, und einer minifizierten `index.min.json`
   zusammen. Dann ersetzt der Job `dll/` und beide Index-Dateien auf dem `repo`-Branch und committet. Der Branch enthält
   nur die Builds des letzten Laufs.

`AssemblyName`, `Version`, `Description` und `Authors` kommen aus der csproj jedes Plugins. Halte sie deshalb aktuell.

## Plugin installieren

Server laden Plugins automatisch vom `repo`-Branch herunter. Betreiber listen die gewünschten Plugins in `plugins.yml`
auf. Siehe [Plugin-Verwaltung](/de/SchulyServer/plugin-management). `index.min.json` ist der Katalog, den Server lesen,
um Plugins und Versionen zu finden.
