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
└── Schuly.Plugin.Abstractions/
    ├── ISchulyPlugin.cs                        # + PluginServiceContext record
    ├── IPluginBackgroundTask.cs
    ├── IPluginEventHandler.cs
    ├── IPluginUserContext.cs
    ├── IPluginLogin.cs                         # + PluginLoginResult record
    ├── NUGET_README.md                         # packed as the NuGet README
    ├── Schuly.Plugin.Abstractions.csproj
    └── libs/                                    # shipped backend DLLs
        ├── Schuly.Domain.dll
        └── Schuly.Infrastructure.dll
```

Die csproj referenziert `libs/Schuly.Domain.dll` und `libs/Schuly.Infrastructure.dll`
(synchronisiert von SchulyBackend), damit das Projekt gegen sie kompiliert, und packt sie
unter `lib/net10.0/`, damit Plugins typisierten DB-Zugriff erhalten. Die transitiven
Abhängigkeiten, die diese DLLs benötigen (`Microsoft.EntityFrameworkCore`,
`Npgsql.EntityFrameworkCore.PostgreSQL`), sind als `PackageReference`s in der csproj deklariert.

## Build

```sh
dotnet build src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj
```

Es gibt kein Testprojekt in diesem Repo; der Vertrag wird von den nachgelagerten Konsumenten
(SchulyBackend und den Plugins) verifiziert.

## Pack-Dry-Run (lokal)

Um das `.nupkg` lokal zu erzeugen, ohne zu veröffentlichen:

```sh
dotnet pack Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

(Vom Repo-Root aus den vollständigen Pfad
`src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj` angeben - genau das führt
auch der Publish-Workflow aus.)

Du übergibst **kein** `-p:Version=`. Die Version stammt aus `application.properties`
(`<version>…</version>`), die `src/Directory.Build.props` zur Projektladezeit per Regex
ausliest und `$(Version)` zuweist. `Directory.Build.props` pinnt zudem die
**Assembly**-Version auf `MAJOR.MINOR.0.0`, damit jedes Plugin mit `MAJOR.MINOR.x` an eine
einzige stabile Assembly-Version bindet, während `FileVersion`/`InformationalVersion` die
vollständige Version für Diagnosezwecke behalten.

Siehe [Veröffentlichung](publishing.md) dazu, wie das Packen in den Release-Ablauf passt.
