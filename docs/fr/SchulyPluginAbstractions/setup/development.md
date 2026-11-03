# Développement

Environnement local pour construire et packager le package abstractions.

## Prérequis

- **.NET SDK 10.0.x** - le projet cible `net10.0`
  (`<TargetFramework>net10.0</TargetFramework>` dans le csproj).
- Le projet utilise une référence de framework `Microsoft.AspNetCore.App`, le shared framework
  ASP.NET Core doit donc être disponible (il est fourni avec le SDK .NET).

## Structure du projet

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

Le package n'a aucune dépendance en dehors de la référence de framework
`Microsoft.AspNetCore.App`. Il n'embarque aucune assembly du backend : les plugins n'atteignent
les données scolaires que via `ISchoolData`.

## Build

La racine du dépôt contient un fichier de solution (`Schuly.Plugin.Abstractions.slnx`) qui
construit ensemble le projet abstractions et son projet de tests :

```sh
dotnet build
```

Ou vise directement le projet abstractions, comme le fait le workflow de publication :

```sh
dotnet build src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj
```

Il existe désormais un projet de tests TUnit (`Schuly.Plugin.Abstractions.Tests`) qui couvre
`PluginSchedule` :

```sh
dotnet test
```

Les interfaces elles-mêmes n'ont pas de comportement propre à l'exécution et restent vérifiées
par les consommateurs en aval (SchulyServer et les plugins).

## Pack à blanc (local)

Pour produire le `.nupkg` localement sans publier :

```sh
dotnet pack Schuly.Plugin.Abstractions.csproj --configuration Release -o ./out
```

(Depuis la racine du dépôt, vise le chemin complet
`src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj` - c'est exactement ce
qu'exécute le workflow de publication.)

Tu ne passes **pas** `-p:Version=`. La version provient de `application.properties`
(`<version>…</version>`), que `src/Directory.Build.props` lit au chargement du projet via une
regex et assigne à `$(Version)`. `Directory.Build.props` fige également la version
d'**assembly** sur `MAJOR.MINOR.0.0`, afin que tout plugin `MAJOR.MINOR.x` se lie à une seule
version d'assembly stable, tandis que `FileVersion` / `InformationalVersion` conservent la
version complète à des fins de diagnostic.

Voir [publication](publishing.md) pour la façon dont le packaging s'intègre au flux de
release.
