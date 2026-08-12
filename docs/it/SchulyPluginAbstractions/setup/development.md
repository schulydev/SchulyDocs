# Sviluppo

Ambiente locale per compilare e pacchettizzare il pacchetto abstractions.

## Prerequisiti

- **.NET SDK 10.0.x** - il progetto ha come target `net10.0`
  (`<TargetFramework>net10.0</TargetFramework>` nel csproj).
- Il progetto usa un framework reference `Microsoft.AspNetCore.App`, quindi lo shared
  framework di ASP.NET Core deve essere disponibile (viene distribuito con il .NET SDK).

## Struttura del progetto

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

Il csproj referenzia `libs/Schuly.Domain.dll` e `libs/Schuly.Infrastructure.dll`
(sincronizzate da SchulyBackend) così il progetto compila contro di esse, e le pacchettizza
sotto `lib/net10.0/` così i plugin ottengono un accesso tipizzato al database. Le dipendenze
transitive di cui queste DLL hanno bisogno (`Microsoft.EntityFrameworkCore`,
`Npgsql.EntityFrameworkCore.PostgreSQL`) sono dichiarate come `PackageReference` nel csproj.

## Build

```sh
dotnet build src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj
```

Non c'è un progetto di test in questo repository; il contratto viene verificato dai
consumatori a valle (SchulyBackend e i plugin).

## Pack dry-run (locale)

Per produrre il `.nupkg` localmente senza pubblicare:

```sh
dotnet pack Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

(Dalla root del repository, punta al percorso completo
`src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj` - è esattamente ciò che
esegue il workflow di pubblicazione.)

Non passi `-p:Version=`. La versione proviene da `application.properties`
(`<version>…</version>`), che `src/Directory.Build.props` legge al caricamento del progetto
tramite una regex e assegna a `$(Version)`. `Directory.Build.props` fissa inoltre la versione
di **assembly** a `MAJOR.MINOR.0.0`, così qualsiasi plugin `MAJOR.MINOR.x` si lega a un'unica
versione di assembly stabile, mentre `FileVersion` / `InformationalVersion` mantengono la
versione completa a scopo diagnostico.

Vedi [pubblicazione](publishing.md) per come il packaging si inserisce nel flusso di release.
