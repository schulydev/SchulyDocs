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

Le csproj référence `libs/Schuly.Domain.dll` et `libs/Schuly.Infrastructure.dll`
(synchronisés depuis SchulyBackend) pour que le projet compile contre eux, et les packages
sous `lib/net10.0/` afin que les plugins bénéficient d'un accès typé à la base de données. Les
dépendances transitives dont ces DLL ont besoin (`Microsoft.EntityFrameworkCore`,
`Npgsql.EntityFrameworkCore.PostgreSQL`) sont déclarées comme `PackageReference` dans le
csproj.

## Build

```sh
dotnet build src/Schuly.Plugin.Abstractions/Schuly.Plugin.Abstractions.csproj
```

Il n'y a pas de projet de tests dans ce dépôt ; le contrat est vérifié par les consommateurs
en aval (SchulyBackend et les plugins).

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
