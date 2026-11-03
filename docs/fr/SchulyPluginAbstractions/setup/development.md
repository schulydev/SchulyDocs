# Développement

Utilise cette page pour compiler, tester et empaqueter le package d'abstractions en local.

## Prérequis

- **SDK .NET 10.0.x.** Le projet cible `net10.0`.
- **Le framework partagé ASP.NET Core.** Le projet a une référence de framework `Microsoft.AspNetCore.App`.
  Le SDK .NET inclut ce framework.

## Structure du projet

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

Le package n'a pas de dépendances au-delà de la référence de framework `Microsoft.AspNetCore.App`. Il ne
contient aucun assembly du backend, donc les plugins n'atteignent les données scolaires que par
`ISchoolData`.

## Compiler

Le fichier de solution à la racine du dépôt (`Schuly.Plugin.Abstractions.slnx`) compile ensemble le projet
d'abstractions et son projet de tests :

```sh
dotnet build
```

Pour compiler uniquement le projet d'abstractions, comme le fait l'étape de pack du workflow de publication :

```sh
dotnet build src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj
```

## Tester

Le projet de tests TUnit `Schuly.Plugin.Abstractions.Tests` couvre `PluginSchedule`
(`PluginScheduleTests.cs`) et la validation de la liaison, `LinkStepValidator` et `LinkDescriptorValidator`
(`LinkingTests.cs`) :

```sh
dotnet test
```

Les interfaces n'ont pas de comportement d'exécution propre. Les consommateurs en aval (SchulyServer et les
plugins) les vérifient.

## Essai de pack

Pour produire le `.nupkg` en local sans publier, exécute cette commande depuis
`src/Schuly.Plugin.Abstractions/` :

```sh
dotnet pack Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

Depuis la racine du dépôt, utilise le chemin complet, comme le fait le workflow de publication :

```sh
dotnet pack src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

Ne passe pas `-p:Version=`. La version vient de `<version>` dans `application.properties`.
`src/Directory.Build.props` la lit au chargement du projet avec une regex et l'attribue à `$(Version)`.

`Directory.Build.props` épingle aussi la version d'assembly à `MAJOR.MINOR.0.0`, donc tout plugin
`MAJOR.MINOR.x` se lie à une seule version d'assembly stable. `FileVersion` et `InformationalVersion` gardent
la version complète pour le diagnostic.

Voir [publication](publishing.md) pour la place du pack dans le processus de release.
