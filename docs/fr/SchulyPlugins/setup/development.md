# Environnement de développement

## Prérequis

- **SDK .NET 10** - chaque csproj de plugin cible `net10.0` (`<TargetFramework>net10.0</TargetFramework>`).
- **Outils CLI EF Core** (`dotnet-ef`) - pour les plugins avec un `DbContext` (Schulware, OdaOrg).
  Installe/mets à jour avec `dotnet tool install --global dotnet-ef` (ou `dotnet tool update`).
  Voir [migrations.md](../migrations.md).
- **[Kiota](https://learn.microsoft.com/openapi/kiota/install)** - nécessaire uniquement pour
  régénérer le client API de Schulware. Voir [setup/kiota-client.md](kiota-client.md).
- Un **[SchulyServer](https://github.com/schulydev/SchulyServer)** en cours d'exécution avec
  PostgreSQL, pour charger et tester un plugin de bout en bout.

## La dépendance vers les abstractions

`Schuly.Plugin.Abstractions` est une **`PackageReference`** NuGet, pas une référence de projet :

```xml
<PackageReference Include="Schuly.Plugin.Abstractions" Version="0.11.*" />
```

Elle fournit tout le contrat : `ISchulyPlugin`, `IPluginBackgroundTask`, `IPluginUserContext`,
`IPluginLogin`, `ISchoolData` (avec ses records), `IPluginVault`, `IPluginFileStore` et
`PluginServiceContext`. Les plugins ne référencent rien du backend ; l'hôte enregistre les
implémentations des services dans le conteneur de chaque plugin à l'exécution.

Le backend refuse de charger un plugin compilé avec une version de contrat incompatible (avant
1.0 : un MAJOR.MINOR différent), et le workflow de publication enregistre cette version comme `contract` dans
`index.json` pour que le backend ne se mette jamais à jour automatiquement vers un build qu'il ne peut pas charger.

## Comment un plugin est structuré

Un plugin est une bibliothèque de classes qui expose une implémentation `ISchulyPlugin` (la
racine de composition, compacte comme un `Program.cs` ASP.NET). Les plugins les plus étoffés
conservent leurs routes HTTP dans `Controllers/` (découvertes comme ApplicationPart MVC) plutôt
que de les mapper dans `ConfigureEndpoints`, et répartissent la logique de synchronisation entre
petits services à portée limitée, pilotés par une seule `IPluginBackgroundTask`.

Voir [adding-a-plugin.md](../adding-a-plugin.md) pour le cycle de vie complet.

## Compiler un plugin

```sh
# Restore + build a single plugin
dotnet build src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release

# Produce the loadable output (DLL + non-host dependencies) - same command CI uses
dotnet publish src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release -o ./out
```

Chaque plugin dispose aussi d'un fichier de solution `.slnx` pour l'ouvrir de manière autonome
dans un IDE.

## Exécuter un plugin avec un backend en cours d'exécution

L'hôte de plugins du backend charge les DLL de plugins depuis son répertoire `plugins/`
(`/app/plugins/` dans le conteneur) et lit la configuration YAML de chaque plugin depuis son
répertoire de configuration des plugins.

1. Démarre SchulyServer + Postgres (voir le README du backend).
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
   `Schedule`.

Pour savoir comment les plugins sont publiés, voir
[setup/distribution.md](distribution.md).
