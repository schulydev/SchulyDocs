# Configuration de développement

Utilise cette page pour installer les outils, compiler un plugin et l'exécuter sur un serveur local.

## Prérequis

- **SDK .NET 10.** Chaque csproj de plugin cible `net10.0`.
- **Outils CLI EF Core** (`dotnet-ef`), pour les plugins avec un `DbContext` (Schulware, OdaOrg). Voir
  [migrations](../migrations.md).

  ```sh
  dotnet tool install --global dotnet-ef
  dotnet tool update --global dotnet-ef
  ```

- **[Kiota](https://learn.microsoft.com/openapi/kiota/install)**, pour régénérer le client API de Schulware.
  Voir [Client Kiota](kiota-client.md).
- Un **[SchulyServer](/fr/SchulyServer/setup/development)** en cours d'exécution avec PostgreSQL, pour charger
  et tester un plugin de bout en bout.

## La dépendance vers les abstractions

`Schuly.Plugin.Abstractions` est une `PackageReference` NuGet, pas une référence de projet :

```xml
<PackageReference Include="Schuly.Plugin.Abstractions" Version="0.11.*" />
```

Elle fournit tout le contrat, y compris `ISchulyPlugin`, `IPluginBackgroundTask`, `IPluginUserContext`,
`IPluginLogin`, `ISchoolData` et ses records, `IPluginVault`, `IPluginFileStore`, `ILinkedAccounts`,
`ILinkProvider` et `PluginServiceContext`. Voir la
[référence du contrat](/fr/SchulyPluginAbstractions/contract).

Les plugins ne référencent rien du backend. L'hôte enregistre les implémentations des services dans le
conteneur de chaque plugin à l'exécution.

Le backend refuse de charger un plugin compilé pour une version incompatible du contrat. Avant la 1.0, cela
signifie un MAJOR.MINOR différent. Le workflow de publication enregistre la version comme `contract` dans
`index.json`, donc le backend ne passe jamais à un build qu'il ne peut pas charger. Voir
[versionnement](/fr/SchulyPluginAbstractions/versioning).

## Structure d'un plugin

Un plugin est une bibliothèque de classes avec une seule implémentation de `ISchulyPlugin`, la racine de
composition. Les plus grands plugins gardent les routes HTTP dans `Controllers/`, découvertes comme
ApplicationPart MVC, au lieu de les mapper dans `ConfigureEndpoints`. Ils répartissent la logique de
synchronisation entre de petits services scoped pilotés par une seule `IPluginBackgroundTask`.

Voir [Ajouter un plugin](../adding-a-plugin.md) pour le cycle de vie complet.

## Compiler un plugin

```sh
# Restore and build one plugin
dotnet build src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release

# Produce the loadable output (the same command CI uses)
dotnet publish src/Schuly.Plugin.Schulware/Schuly.Plugin.Schulware.csproj -c Release -o ./out
```

Les plugins Example et Schulware ont aussi un fichier `.slnx`, qui ouvre le plugin seul dans un IDE.

## Exécuter un plugin sur un serveur local

Le serveur ne charge un plugin que s'il est listé dans `plugins.yml` et qu'il a un manifeste dans le dossier
des plugins. Il supprime les plugins installés qui ne sont pas listés.

Ces chemins sont relatifs au dossier de l'application du serveur, `<app>`. Avec `dotnet run`, c'est le dossier
de sortie du build de `Schuly.API`. Dans le conteneur, c'est `/app`.

| Fichier | Par défaut | Paramètre |
|---|---|---|
| Liste des plugins | `<app>/plugins.yml` | `Plugins:File` |
| DLL et manifestes des plugins | `<app>/plugins/` | `Plugins:Directory` |
| Configuration des plugins | `<app>/plugins-config/` | `Plugins:ConfigDirectory` |

1. Démarre SchulyServer et Postgres. Voir la
   [configuration de développement](/fr/SchulyServer/setup/development) du serveur.
2. Exécute `dotnet publish` comme indiqué ci-dessus.
3. Copie `out/Schuly.Plugin.<Name>.dll` et les DLL de ses dépendances tierces, comme Kiota ou AngleSharp, dans
   le dossier des plugins. Laisse de côté ce que le serveur fournit : `Microsoft.AspNetCore.*`,
   `Microsoft.Extensions.*`, `Microsoft.EntityFrameworkCore.*`, `Npgsql.*`, `Mediator.*` et
   `Schuly.Plugin.Abstractions.dll`.
4. Dans le dossier des plugins, crée le manifeste `Schuly.Plugin.<Name>.plugin.json`. Liste dans `files` chaque
   fichier que tu as copié :

   ```json
   {
     "name": "Schuly.Plugin.<Name>",
     "version": "1.0.0",
     "dll": "Schuly.Plugin.<Name>.dll",
     "files": ["Schuly.Plugin.<Name>.dll"]
   }
   ```

5. Ajoute le plugin à `plugins.yml` avec la même version que le manifeste. Si la version diffère et que le
   plugin est aussi dans le registre, le serveur remplace ton build par celui du registre.

   ```yaml
   plugins:
     - name: Schuly.Plugin.<Name>
       version: 1.0.0
   ```

6. Si le plugin a besoin d'une configuration, enregistre-la sous `Schuly.Plugin.<Name>.yml` (ou `.yaml`) dans
   le dossier de configuration des plugins.
   - Schulware exige `SchulwareApi.BaseUrl`. Voir
     [`config.yml`](https://github.com/schulydev/SchulyPlugins/blob/main/src/Schuly.Plugin.Schulware/config.yml)
     pour le schéma.
   - Microsoft exige `MicrosoftApi.BaseUrl`.

   Sans sa valeur obligatoire, le `ConfigureServices` du plugin lève une exception et le plugin ne se charge
   pas.
7. Redémarre le serveur.

Au démarrage, l'hôte appelle `ConfigureServices`, puis `MigrateAsync`, qui crée ou met à niveau la base de
données Postgres du plugin, puis `ConfigureEndpoints`. Il planifie ensuite chaque `IPluginBackgroundTask` selon
son `Schedule`.

Pour voir comment les plugins sont publiés, lis [distribution](distribution.md).
