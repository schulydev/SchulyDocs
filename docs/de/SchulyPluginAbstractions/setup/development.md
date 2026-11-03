# Entwicklung

Lokale Umgebung zum Bauen und Packen des Abstractions-Package.

## Voraussetzungen

- **.NET SDK 10.0.x** - das Projekt zielt auf `net10.0`
  (`<TargetFramework>net10.0</TargetFramework>` in der csproj).
- Das Projekt nutzt eine `Microsoft.AspNetCore.App`-Framework-Referenz, daher muss das
  ASP.NET-Core-Shared-Framework verfügbar sein (es wird mit dem .NET SDK ausgeliefert).

## Projektstruktur

```
src/
├── Directory.Build.props                      # reads <version> from application.properties
├── Schuly.Plugin.Abstractions/
│   ├── ISchulyPlugin.cs                        # + PluginServiceContext record
│   ├── IPluginBackgroundTask.cs
│   ├── PluginSchedule.cs                       # PluginSchedule record
│   ├── IPluginEventHandler.cs
│   ├── IPluginUserContext.cs
│   ├── IPluginLogin.cs                         # + PluginLoginResult record
│   ├── SchoolSystemDescriptor.cs
│   ├── ISchoolData.cs                          # + SyncResult record
│   ├── SchoolRecords.cs                        # records ISchoolData accepts
│   ├── IPluginVault.cs
│   ├── IPluginFileStore.cs                     # + StoredFile record
│   ├── NUGET_README.md                         # packed as the NuGet README
│   └── Schuly.Plugin.Abstractions.csproj
└── Schuly.Plugin.Abstractions.Tests/
    ├── PluginScheduleTests.cs
    └── Schuly.Plugin.Abstractions.Tests.csproj
```

Das Package hat keine Abhängigkeiten ausser der `Microsoft.AspNetCore.App`-Framework-Referenz.
Es liefert keine Backend-Assemblies aus: Plugins erreichen Schuldaten nur über `ISchoolData`.

## Build

Das Repo-Root enthält eine Solution-Datei (`Schuly.Plugin.Abstractions.slnx`), die das
Abstractions-Projekt und sein Testprojekt zusammen baut:

```sh
dotnet build
```

Oder gib das Abstractions-Projekt direkt an, wie es der Publish-Workflow tut:

```sh
dotnet build src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj
```

Es gibt jetzt ein TUnit-Testprojekt (`Schuly.Plugin.Abstractions.Tests`), das `PluginSchedule`
abdeckt:

```sh
dotnet test
```

Die Interfaces selbst haben kein eigenes Laufzeitverhalten. Die nachgelagerten Konsumenten
(SchulyServer und die Plugins) verifizieren sie weiterhin.

## Pack-Dry-Run (lokal)

Um das `.nupkg` lokal zu erzeugen, ohne zu veröffentlichen:

```sh
dotnet pack Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

(Gib vom Repo-Root aus den vollständigen Pfad
`src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj` an - genau das führt der
Publish-Workflow aus.)

Du übergibst **kein** `-p:Version=`. Die Version stammt aus `application.properties`
(`<version>…</version>`), die `src/Directory.Build.props` zur Projektladezeit per Regex
ausliest und `$(Version)` zuweist. `Directory.Build.props` pinnt zudem die
**Assembly**-Version auf `MAJOR.MINOR.0.0`, damit jedes Plugin mit `MAJOR.MINOR.x` an eine
einzige stabile Assembly-Version bindet, während `FileVersion` / `InformationalVersion` die
vollständige Version für Diagnosezwecke behalten.

Siehe [Veröffentlichung](publishing.md) dazu, wie das Packen in den Release-Ablauf passt.
