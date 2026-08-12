# Environnement de développement

## Prérequis

- **SDK .NET 10** - chaque csproj de plugin cible `net10.0`
  (`<TargetFramework>net10.0</TargetFramework>`).
- **Outils CLI EF Core** (`dotnet-ef`) - pour les plugins avec un `DbContext` (Schulware,
  OdaOrg). Installe/mets à jour avec `dotnet tool install --global dotnet-ef` (ou
  `dotnet tool update`). Voir [migrations.md](../migrations.md).
- **[Kiota](https://learn.microsoft.com/openapi/kiota/install)** - nécessaire uniquement pour
  régénérer le client API de Schulware. Voir [setup/kiota-client.md](kiota-client.md).
- Un **[SchulyBackend](https://github.com/schulydev/SchulyBackend)** en cours d'exécution avec
  PostgreSQL, pour charger et tester un plugin de bout en bout.

## La dépendance vers les abstractions

`Schuly.Plugin.Abstractions` est une **`PackageReference`** NuGet, pas une référence de projet :

```xml
<PackageReference Include="Schuly.Plugin.Abstractions" Version="0.2.*" />
```

Elle fournit `ISchulyPlugin`, `IPluginBackgroundTask`, `IPluginUserContext`, `IPluginLogin` et
`PluginServiceContext`. Les types fournis par le backend comme `IPluginVault`
(`Schuly.Infrastructure.Vault`) sont résolus à l'exécution depuis le conteneur DI de l'hôte -
l'hôte enregistre le coffre-fort isolé de chaque plugin, indexé par son `Name`.

## Comment un plugin est structuré

Un plugin est une bibliothèque de classes qui expose une implémentation `ISchulyPlugin` (la
racine de composition, compacte comme un `Program.cs` ASP.NET). Les plugins les plus étoffés
conservent leurs routes HTTP dans `Controllers/` (découvertes comme ApplicationPart MVC) plutôt
que de les mapper dans `ConfigureEndpoints`, et répartissent la logique de synchronisation entre
petits services à portée limitée, pilotés par une seule `IPluginBackgroundTask`.

Voir [adding-a-plugin.md](../adding-a-plugin.md) pour le cycle de vie complet.

## Compiler un plugin

```sh
# Restaurer + compiler un seul plugin
dotnet build src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release

# Produire le résultat chargeable (DLL + dépendances non fournies par l'hôte) - même commande que la CI
dotnet publish src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release -o ./out
```

Chaque plugin dispose aussi d'un fichier de solution `.slnx` pour l'ouvrir de manière autonome
dans un IDE.

## Exécuter un plugin face à un backend en production

L'hôte de plugins du backend charge les DLL de plugins depuis son répertoire `plugins/`
(`/app/plugins/` dans le conteneur) et lit la configuration YAML de chaque plugin depuis son
répertoire de configuration des plugins.

1. Démarre SchulyBackend + Postgres (voir le README du backend).
2. Fais un `dotnet publish` du plugin (ci-dessus) et copie la DLL du plugin ainsi que ses DLL de
   dépendances tierces dans le dossier `plugins/` du backend. Les assemblies partagées par
   l'hôte (ASP.NET Core, EF Core, Npgsql, les abstractions, les assemblies hôtes de Schuly) sont
   déjà fournies par le backend - seules les véritables dépendances tierces (par ex. Kiota,
   AngleSharp) doivent accompagner le plugin.
3. Dépose la configuration à l'exécution du plugin sous le nom `Schuly.Plugin.<Name>.yml` dans le
   répertoire de configuration des plugins du backend. Pour Schulware, elle **doit** contenir au
   moins `SchulwareApi.BaseUrl` - sinon `ConfigureServices` lève une exception et refuse le
   chargement (voir `src/Schuly.Plugin.Schulware/config.yml` pour le schéma).
4. Redémarre le backend. Au démarrage, l'hôte appelle `ConfigureServices` → `ConfigureEndpoints`
   → `MigrateAsync` (qui exécute `db.Database.MigrateAsync()` pour créer/mettre à jour la base
   Postgres dédiée du plugin), puis planifie chaque `IPluginBackgroundTask` selon son
   `Interval`.

Pour la distribution réelle (téléchargement des DLL précompilées via `curl`), voir
[setup/distribution.md](distribution.md).
