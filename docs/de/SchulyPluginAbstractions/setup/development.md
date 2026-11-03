# Entwicklung

Nutze diese Seite, um das Abstractions-Package lokal zu bauen, zu testen und zu packen.

## Voraussetzungen

- **.NET SDK 10.0.x.** Das Projekt zielt auf `net10.0`.
- **Das ASP.NET Core Shared Framework.** Das Projekt hat eine Framework-Referenz auf
  `Microsoft.AspNetCore.App`. Das .NET SDK enthält dieses Framework.

## Projektstruktur

```
application.properties                          # holds <version>
global.json                                     # test runner: Microsoft.Testing.Platform
Schuly.Plugin.Abstractions.slnx
src/
├── Directory.Build.props                       # reads <version> from application.properties
├── Schuly.Plugin.Abstractions/
│   ├── ILinkedAccounts.cs                      # + LinkedAccountRecord, LinkedAccount, LinkedProviders, LinkedSecrets
│   ├── IPluginBackgroundTask.cs
│   ├── IPluginEventHandler.cs
│   ├── IPluginFileStore.cs                     # + StoredFile record
│   ├── IPluginLogin.cs                         # + PluginLoginResult record
│   ├── IPluginUserContext.cs
│   ├── IPluginVault.cs
│   ├── ISchoolData.cs                          # + SyncResult record
│   ├── ISchulyPlugin.cs                        # + PluginServiceContext record
│   ├── Linking/
│   │   ├── ILinkProvider.cs                    # + descriptor, step, field, and context records
│   │   ├── LinkDescriptorValidator.cs
│   │   ├── LinkStepValidator.cs
│   │   └── LinkValidationResult.cs
│   ├── NUGET_README.md                         # packed as the NuGet README
│   ├── PluginSchedule.cs                       # PluginSchedule record
│   ├── PluginUserPurgeEvent.cs
│   ├── SchoolRecords.cs                        # records ISchoolData accepts
│   ├── SchoolSystemDescriptor.cs               # + login field, login method, and browser login records
│   └── Schuly.Plugin.Abstractions.csproj
└── Schuly.Plugin.Abstractions.Tests/
    ├── LinkingTests.cs
    ├── PluginScheduleTests.cs
    └── Schuly.Plugin.Abstractions.Tests.csproj
```

Das Package hat keine Abhängigkeiten ausser der Framework-Referenz `Microsoft.AspNetCore.App`. Es liefert
keine Backend-Assemblies aus. Plugins erreichen Schuldaten also nur über `ISchoolData`.

## Bauen

Die Solution-Datei im Repo-Root (`Schuly.Plugin.Abstractions.slnx`) baut das Abstractions-Projekt und sein
Testprojekt zusammen:

```sh
dotnet build
```

So baust du nur das Abstractions-Projekt, wie es der Pack-Schritt des Publish-Workflows tut:

```sh
dotnet build src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj
```

## Testen

Das TUnit-Testprojekt `Schuly.Plugin.Abstractions.Tests` deckt `PluginSchedule`
(`PluginScheduleTests.cs`) und die Link-Validierung ab, also `LinkStepValidator` und
`LinkDescriptorValidator` (`LinkingTests.cs`):

```sh
dotnet test
```

Die Interfaces haben kein eigenes Laufzeitverhalten. Die nachgelagerten Nutzer (SchulyServer und die
Plugins) prüfen sie.

## Pack-Testlauf

Um das `.nupkg` lokal zu erzeugen, ohne es zu veröffentlichen, führe das in
`src/Schuly.Plugin.Abstractions/` aus:

```sh
dotnet pack Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

Nutze im Repo-Root den vollen Pfad, wie es der Publish-Workflow tut:

```sh
dotnet pack src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

Übergib kein `-p:Version=`. Die Version kommt aus `<version>` in `application.properties`.
`src/Directory.Build.props` liest sie beim Laden des Projekts mit einer Regex und weist sie `$(Version)` zu.

`Directory.Build.props` legt die Assembly-Version ausserdem auf `MAJOR.MINOR.0.0` fest. So bindet jedes
`MAJOR.MINOR.x`-Plugin an eine stabile Assembly-Version. `FileVersion` und `InformationalVersion` behalten
die volle Version für die Diagnose.

Unter [Veröffentlichung](publishing.md) siehst du, wie das Packen in den Release-Ablauf passt.
