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

Il pacchetto non ha dipendenze oltre al framework reference `Microsoft.AspNetCore.App`.
Non distribuisce assembly del backend: i plugin raggiungono i dati scolastici solo tramite `ISchoolData`.

## Build

La root del repository contiene un file di soluzione (`Schuly.Plugin.Abstractions.slnx`) che
compila insieme il progetto abstractions e il suo progetto di test:

```sh
dotnet build
```

Oppure punta direttamente al progetto abstractions, come fa il workflow di pubblicazione:

```sh
dotnet build src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj
```

Ora esiste un progetto di test TUnit (`Schuly.Plugin.Abstractions.Tests`) che copre
`PluginSchedule`:

```sh
dotnet test
```

Le interfacce stesse non hanno un comportamento a runtime proprio e vengono ancora verificate dai
consumatori a valle (SchulyServer e i plugin).

## Pack dry-run (locale)

Per produrre il `.nupkg` localmente senza pubblicare:

```sh
dotnet pack Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

(Dalla root del repository, punta al percorso completo
`src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj` - è esattamente ciò che
esegue il workflow di pubblicazione.)

**Non** passi `-p:Version=`. La versione proviene da `application.properties`
(`<version>…</version>`), che `src/Directory.Build.props` legge al caricamento del progetto
tramite una regex e assegna a `$(Version)`. `Directory.Build.props` fissa inoltre la versione
di **assembly** a `MAJOR.MINOR.0.0`, così qualsiasi plugin `MAJOR.MINOR.x` si lega a un'unica
versione di assembly stabile, mentre `FileVersion` / `InformationalVersion` mantengono la
versione completa a scopo diagnostico.

Vedi [pubblicazione](publishing.md) per come il packaging si inserisce nel flusso di release.
