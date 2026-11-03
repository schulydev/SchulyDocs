# Sviluppo

Usa questa pagina per compilare, testare e impacchettare in locale il pacchetto delle astrazioni.

## Prerequisiti

- **.NET SDK 10.0.x.** Il progetto ha come target `net10.0`.
- **Il framework condiviso ASP.NET Core.** Il progetto ha un riferimento al framework `Microsoft.AspNetCore.App`.
  Il .NET SDK include questo framework.

## Struttura del progetto

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

Il pacchetto non ha dipendenze oltre al riferimento al framework `Microsoft.AspNetCore.App`. Non include
assembly del backend, quindi i plugin raggiungono i dati scolastici solo tramite `ISchoolData`.

## Build

Il file di soluzione nella radice del repository (`Schuly.Plugin.Abstractions.slnx`) compila insieme il progetto delle astrazioni e
il suo progetto di test:

```sh
dotnet build
```

Per compilare solo il progetto delle astrazioni, come fa il passaggio di pack del workflow di pubblicazione:

```sh
dotnet build src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj
```

## Test

Il progetto di test TUnit `Schuly.Plugin.Abstractions.Tests` copre `PluginSchedule`
(`PluginScheduleTests.cs`) e la validazione del collegamento, `LinkStepValidator` e `LinkDescriptorValidator`
(`LinkingTests.cs`):

```sh
dotnet test
```

Le interfacce non hanno un comportamento proprio a runtime. Le verificano i consumatori a valle (SchulyServer e i plugin).

## Prova del pack

Per produrre il `.nupkg` in locale senza pubblicarlo, esegui questo comando da `src/Schuly.Plugin.Abstractions/`:

```sh
dotnet pack Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

Dalla radice del repository, usa il percorso completo, come fa il workflow di pubblicazione:

```sh
dotnet pack src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

Non passare `-p:Version=`. La versione viene da `<version>` in `application.properties`.
`src/Directory.Build.props` la legge al caricamento del progetto con una regex e la assegna a `$(Version)`.

`Directory.Build.props` fissa anche la versione dell'assembly a `MAJOR.MINOR.0.0`, quindi ogni plugin `MAJOR.MINOR.x`
si lega a un'unica versione stabile dell'assembly. `FileVersion` e `InformationalVersion` mantengono la versione completa per la
diagnostica.

Vedi [pubblicazione](publishing.md) per come il pack si inserisce nel flusso di release.
